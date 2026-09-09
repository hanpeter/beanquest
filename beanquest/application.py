from datetime import datetime, timezone

from beanquest.auth import PasswordAuth
from beanquest.db import Database
from beanquest.errors import NotFound, RateLimited, Unauthorized
from beanquest.models import AuthIdentity, BrewingMethod, PastLog, RoastingMethod, User


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
        # the password — this is what makes the 5-attempt limit race-safe
        # under concurrent requests (see LoginAttempt.UPSERT_FAILURE) without
        # holding a lock across the slow bcrypt check below. A successful
        # login clears it again at the end.
        if self._database.record_login_failure(email) is None:
            raise RateLimited('too many failed login attempts', self._retry_after_seconds(email))

        user = self._database.get_user_by_email(email)
        identity = self._database.get_auth_identity(user.id, 'password') if user else None
        if (
            not user
            or not identity
            or not identity.password_hash
            or not self._password_auth.verify(password, identity.password_hash)
        ):
            # Same message regardless of which check failed — don't leak
            # whether the account exists or which factor was wrong. The
            # failure is already recorded above; nothing more to do here.
            raise Unauthorized('invalid email or password')

        self._database.reset_login_attempts(email)
        return user

    def _retry_after_seconds(self, email: str) -> int:
        attempt = self._database.get_login_attempt(email)
        if attempt is None or attempt.locked_until is None:
            return 1
        remaining = (attempt.locked_until - datetime.now(timezone.utc)).total_seconds()
        return max(1, int(remaining) + 1)

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
