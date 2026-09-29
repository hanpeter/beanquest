from datetime import datetime
from textwrap import dedent
from typing import ClassVar

from pydantic import BaseModel, ConfigDict

from beanquest.models.validator import OptionalText


class BrewingMethod(BaseModel):
    model_config = ConfigDict(extra='forbid')

    BASE_SELECT: ClassVar[str] = (
        'SELECT id, method_name, machine_used, grinder_used, user_id, created_at, modified_at '
        'FROM brewing_methods'
    )
    SELECT_ALL: ClassVar[str] = BASE_SELECT + ' WHERE user_id = %s'
    SELECT_ONE: ClassVar[str] = BASE_SELECT + ' WHERE id = %s AND user_id = %s'
    INSERT: ClassVar[str] = dedent('''\
        INSERT INTO brewing_methods (method_name, machine_used, grinder_used, user_id)
        VALUES (%(method_name)s, %(machine_used)s, %(grinder_used)s, %(user_id)s)
        RETURNING id
    ''')
    UPDATE: ClassVar[str] = dedent('''\
        UPDATE brewing_methods SET
            method_name = %(method_name)s,
            machine_used = %(machine_used)s,
            grinder_used = %(grinder_used)s,
            modified_at = CURRENT_TIMESTAMP
        WHERE id = %(id)s AND user_id = %(user_id)s
    ''')
    DELETE: ClassVar[str] = 'DELETE FROM brewing_methods WHERE id = %s AND user_id = %s'
    SERVER_FIELDS: ClassVar[frozenset[str]] = frozenset({'created_at', 'modified_at'})

    id: int | None = None
    user_id: int
    method_name: str
    machine_used: OptionalText = ''
    grinder_used: OptionalText = ''
    created_at: datetime | None = None
    modified_at: datetime | None = None
