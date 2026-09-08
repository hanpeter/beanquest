from beanquest.db import Database
from beanquest.errors import NotFound
from beanquest.models import BrewingMethod, PastLog, RoastingMethod, User


class Application:
    def __init__(self, database: Database):
        self._database = database

    # -------------------------------------------------------------------------
    # User
    # -------------------------------------------------------------------------

    def get_user(self, id) -> User:
        result = self._database.get_user(id)
        if result is None:
            raise NotFound(f'User {id} not found')
        return result

    def get_users(self) -> list[User]:
        return self._database.get_users()

    def add_user(self, user: User) -> User:
        id = self._database.add_user(user)
        return self.get_user(id)

    def delete_user(self, id: int) -> None:
        self._database.delete_user(id)

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
