from datetime import datetime
from textwrap import dedent
from typing import ClassVar

from pydantic import BaseModel, ConfigDict

from beanquest.models.validator import OptionalText


class RoastingMethod(BaseModel):
    model_config = ConfigDict(extra='forbid')

    BASE_SELECT: ClassVar[str] = (
        'SELECT id, roaster_name, description, user_id, created_at, modified_at '
        'FROM roasting_methods'
    )
    SELECT_ALL: ClassVar[str] = BASE_SELECT + ' WHERE user_id = %s'
    SELECT_ONE: ClassVar[str] = BASE_SELECT + ' WHERE id = %s AND user_id = %s'
    INSERT: ClassVar[str] = dedent('''\
        INSERT INTO roasting_methods (roaster_name, description, user_id)
        VALUES (%(roaster_name)s, %(description)s, %(user_id)s)
        RETURNING id
    ''')
    UPDATE: ClassVar[str] = dedent('''\
        UPDATE roasting_methods SET
            roaster_name = %(roaster_name)s,
            description = %(description)s,
            modified_at = CURRENT_TIMESTAMP
        WHERE id = %(id)s AND user_id = %(user_id)s
    ''')
    DELETE: ClassVar[str] = 'DELETE FROM roasting_methods WHERE id = %s AND user_id = %s'
    SERVER_FIELDS: ClassVar[frozenset[str]] = frozenset({'created_at', 'modified_at'})

    id: int | None = None
    user_id: int
    roaster_name: str
    description: OptionalText = ''
    created_at: datetime | None = None
    modified_at: datetime | None = None
