from beanquest.db import Database
from beanquest.errors import NotFound
from beanquest.models import BrewingMethod, PastLog, RoastingMethod


class Application:
    def __init__(self, database: Database):
        self._database = database

    # -------------------------------------------------------------------------
    # BrewingMethod
    # -------------------------------------------------------------------------

    def get_brewing_method(self, id) -> BrewingMethod:
        result = self._database.get_brewing_method(id)
        if result is None:
            raise NotFound(f'BrewingMethod {id} not found')
        return result

    def get_brewing_methods(self) -> list[BrewingMethod]:
        return self._database.get_brewing_methods()

    def add_brewing_method(self, brewing_method: BrewingMethod) -> BrewingMethod:
        id = self._database.add_brewing_method(brewing_method)
        return self.get_brewing_method(id)

    def update_brewing_method(self, brewing_method: BrewingMethod) -> BrewingMethod:
        self._database.update_brewing_method(brewing_method)
        return self.get_brewing_method(brewing_method.id)

    def delete_brewing_method(self, id: int) -> None:
        self.get_brewing_method(id)
        self._database.delete_brewing_method(id)

    # -------------------------------------------------------------------------
    # RoastingMethod
    # -------------------------------------------------------------------------

    def get_roasting_method(self, id) -> RoastingMethod:
        result = self._database.get_roasting_method(id)
        if result is None:
            raise NotFound(f'RoastingMethod {id} not found')
        return result

    def get_roasting_methods(self) -> list[RoastingMethod]:
        return self._database.get_roasting_methods()

    def add_roasting_method(self, roasting_method: RoastingMethod) -> RoastingMethod:
        id = self._database.add_roasting_method(roasting_method)
        return self.get_roasting_method(id)

    def update_roasting_method(self, roasting_method: RoastingMethod) -> RoastingMethod:
        self._database.update_roasting_method(roasting_method)
        return self.get_roasting_method(roasting_method.id)

    def delete_roasting_method(self, id: int) -> None:
        self.get_roasting_method(id)
        self._database.delete_roasting_method(id)

    # -------------------------------------------------------------------------
    # PastLog
    # -------------------------------------------------------------------------

    def get_past_log(self, id) -> PastLog:
        result = self._database.get_past_log(id)
        if result is None:
            raise NotFound(f'PastLog {id} not found')
        return result

    def get_past_logs(self) -> list[PastLog]:
        return self._database.get_past_logs()

    def add_past_log(self, past_log: PastLog) -> PastLog:
        id = self._database.add_past_log(past_log)
        return self.get_past_log(id)

    def update_past_log(self, past_log: PastLog) -> PastLog:
        self._database.update_past_log(past_log)
        return self.get_past_log(past_log.id)

    def delete_past_log(self, id: int) -> None:
        self.get_past_log(id)
        self._database.delete_past_log(id)
