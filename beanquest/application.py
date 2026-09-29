from datetime import datetime, timezone

from beanquest.auth import PasswordAuth
from beanquest.db import Database
from beanquest.errors import InvalidCredentials, NotFound, RateLimited
from beanquest.models import AuthIdentity, BrewingMethod, LoginAttempt, PastLog, RoastingMethod, User


def _seconds_until(moment: datetime) -> int:
    remaining = (moment - datetime.now(timezone.utc)).total_seconds()
    return max(1, int(remaining) + 1)


class Application:
    def __init__(self, database: Database, password_auth: PasswordAuth):
        self._database = database
        self._password_auth = password_auth

    # -------------------------------------------------------------------------
    # User / auth
    # -------------------------------------------------------------------------

    # TODO: no way to change a password (or update a profile) once set —
    # needs an AuthIdentity.UPDATE + a change-password endpoint.

    def get_user(self, id) -> User:
        result = self._database.get_user(id)
        if result is None:
            raise NotFound(f'User {id} not found')
        return result

    def email_exists(self, email: str) -> bool:
        return self._database.get_user_by_email(email) is not None

    def create_user_with_password(self, user: User, password: str) -> User:
        """The only way a user comes into existence — always with a login
        method attached. A future create_user_with_google etc. would follow
        this same shape: insert the user, then link an auth_identity to it.
        """
        password_hash = self._password_auth.create(password)
        with self._database.transaction() as conn:
            user_id = self._database.add_user(user, conn=conn)
            identity = AuthIdentity(user_id=user_id, provider='password', password_hash=password_hash)
            self._database.add_auth_identity(identity, conn=conn)
        return self.get_user(user_id)

    def verify_password_login(self, email: str, password: str) -> User:
        # Reserve this attempt and record it as a failure *before* touching
        # the password — this is what makes the attempt limit race-safe under
        # concurrent requests (see LoginAttempt.UPSERT_FAILURE) without holding
        # a lock across the slow bcrypt check below. A successful login clears
        # it again at the end.
        attempt = self._database.record_login_failure(email)
        if attempt is None:
            raise RateLimited('too many failed login attempts', self._retry_after_seconds(email))

        user = self._database.get_user_by_email(email)
        identity = self._database.get_auth_identity(user.id, 'password') if user else None
        if (
            not user
            or not identity
            or not identity.password_hash
            or not self._password_auth.verify(password, identity.password_hash)
        ):
            # Same message regardless of which check failed — don't leak which
            # factor was wrong. attempts_left is safe to report: UPSERT_FAILURE
            # creates a row for any address, account or not, so the count says
            # nothing about whether the account exists. It's a narrower signal
            # on login history too, now that a stale count also resets on
            # simple elapsed time (see UPSERT_FAILURE's decay behavior) — but
            # not a closed one: an attacker probing more often than one
            # LOCK_DURATION apart can still see attempts_left jump back up the
            # instant a successful login clears the row.
            if attempt.failure_count >= LoginAttempt.MAX_FAILURES:
                # This failure is the one that hit the limit — report the lock
                # now, using the row already in hand, rather than letting the
                # client discover it on the next attempt. Checked via
                # failure_count rather than `locked_until is not None`, so this
                # stays correct even if a future change lets locked_until carry
                # a stale value below the threshold.
                raise RateLimited(
                    'too many failed login attempts', _seconds_until(attempt.locked_until)
                )
            raise InvalidCredentials(
                'invalid email or password',
                LoginAttempt.MAX_FAILURES - attempt.failure_count,
            )

        self._database.reset_login_attempts(email)
        return user

    def _retry_after_seconds(self, email: str) -> int:
        # Only reached when record_login_failure returned None — i.e. the row
        # was *already* locked, so UPSERT_FAILURE's WHERE guard left it
        # untouched and RETURNING gave us nothing (that guard is what stops
        # hammering an account from extending its own lock). We don't hold
        # locked_until in that case, so a refetch here is required, not
        # avoidable — it's confined to the already-locked path; the failure
        # that *causes* the lock never comes through here.
        attempt = self._database.get_login_attempt(email)
        if attempt is None or attempt.locked_until is None:
            # Race: the lock expired, or a concurrent login succeeded and
            # cleared the row, between the upsert and this fetch.
            return 1
        return _seconds_until(attempt.locked_until)

    # -------------------------------------------------------------------------
    # BrewingMethod
    # -------------------------------------------------------------------------

    def get_brewing_method(self, id, user_id) -> BrewingMethod:
        result = self._database.get_brewing_method(id, user_id)
        if result is None:
            raise NotFound(f'BrewingMethod {id} not found')
        return result

    def get_brewing_methods(self, user_id) -> list[BrewingMethod]:
        return self._database.get_brewing_methods(user_id)

    def add_brewing_method(self, brewing_method: BrewingMethod) -> BrewingMethod:
        id = self._database.add_brewing_method(brewing_method)
        return self.get_brewing_method(id, brewing_method.user_id)

    def update_brewing_method(self, brewing_method: BrewingMethod) -> BrewingMethod:
        self._database.update_brewing_method(brewing_method)
        return self.get_brewing_method(brewing_method.id, brewing_method.user_id)

    def delete_brewing_method(self, id: int, user_id: int) -> None:
        self._database.delete_brewing_method(id, user_id)

    # -------------------------------------------------------------------------
    # RoastingMethod
    # -------------------------------------------------------------------------

    def get_roasting_method(self, id, user_id) -> RoastingMethod:
        result = self._database.get_roasting_method(id, user_id)
        if result is None:
            raise NotFound(f'RoastingMethod {id} not found')
        return result

    def get_roasting_methods(self, user_id) -> list[RoastingMethod]:
        return self._database.get_roasting_methods(user_id)

    def add_roasting_method(self, roasting_method: RoastingMethod) -> RoastingMethod:
        id = self._database.add_roasting_method(roasting_method)
        return self.get_roasting_method(id, roasting_method.user_id)

    def update_roasting_method(self, roasting_method: RoastingMethod) -> RoastingMethod:
        self._database.update_roasting_method(roasting_method)
        return self.get_roasting_method(roasting_method.id, roasting_method.user_id)

    def delete_roasting_method(self, id: int, user_id: int) -> None:
        self._database.delete_roasting_method(id, user_id)

    # -------------------------------------------------------------------------
    # PastLog
    # -------------------------------------------------------------------------

    def get_past_log(self, id, user_id) -> PastLog:
        result = self._database.get_past_log(id, user_id)
        if result is None:
            raise NotFound(f'PastLog {id} not found')
        return result

    def get_past_logs(self, user_id) -> list[PastLog]:
        return self._database.get_past_logs(user_id)

    def add_past_log(self, past_log: PastLog) -> PastLog:
        self._ensure_methods_owned(past_log)
        id = self._database.add_past_log(past_log)
        return self.get_past_log(id, past_log.user_id)

    def update_past_log(self, past_log: PastLog) -> PastLog:
        self._ensure_methods_owned(past_log)
        self._database.update_past_log(past_log)
        return self.get_past_log(past_log.id, past_log.user_id)

    def delete_past_log(self, id: int, user_id: int) -> None:
        self._database.delete_past_log(id, user_id)

    def _ensure_methods_owned(self, past_log: PastLog) -> None:
        """Raise NotFound if the referenced methods don't belong to this user."""
        self.get_brewing_method(past_log.brewing_method_id, past_log.user_id)
        self.get_roasting_method(past_log.roasting_method_id, past_log.user_id)
