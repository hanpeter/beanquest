from datetime import datetime
from textwrap import dedent
from typing import ClassVar

from pydantic import BaseModel, ConfigDict

from beanquest.models.validator import OptionalText


class RoastingMethod(BaseModel):
    model_config = ConfigDict(extra='forbid')

    SELECT_ALL: ClassVar[str] = (
        'SELECT id, roaster_name, description, created_at, modified_at '
        'FROM roasting_methods'
    )
    SELECT_ONE: ClassVar[str] = SELECT_ALL + ' WHERE id = %s'
    INSERT: ClassVar[str] = dedent('''\
        INSERT INTO roasting_methods (roaster_name, description)
        VALUES (%(roaster_name)s, %(description)s)
        RETURNING id
    ''')
    UPDATE: ClassVar[str] = dedent('''\
        UPDATE roasting_methods SET
            roaster_name = %(roaster_name)s,
            description = %(description)s,
            modified_at = CURRENT_TIMESTAMP
        WHERE id = %(id)s
    ''')
    DELETE: ClassVar[str] = 'DELETE FROM roasting_methods WHERE id = %s'
    SERVER_FIELDS: ClassVar[frozenset[str]] = frozenset({'created_at', 'modified_at'})

    id: int | None = None
    roaster_name: str
    description: OptionalText = ''
    created_at: datetime | None = None
    modified_at: datetime | None = None
