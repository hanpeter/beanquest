from datetime import datetime
from textwrap import dedent
from typing import Annotated, ClassVar

from pydantic import BaseModel, ConfigDict, Field

from beanquest.models.validator import OptionalText


class PastLog(BaseModel):
    model_config = ConfigDict(extra='forbid')

    SELECT_ALL: ClassVar[str] = dedent('''\
        SELECT
            past_logs.id,
            past_logs.bean_name,
            past_logs.process,
            past_logs.target_roast_level,
            past_logs.roasting_method_id,
            past_logs.brewing_method_id,
            past_logs.roasting_notes,
            past_logs.grinder_setting,
            past_logs.rating_score,
            past_logs.general_notes,
            past_logs.date_logged,
            brewing_methods.method_name AS brewing_method_name,
            roasting_methods.roaster_name AS roasting_method_name
        FROM past_logs
        INNER JOIN brewing_methods ON past_logs.brewing_method_id = brewing_methods.id
        INNER JOIN roasting_methods ON past_logs.roasting_method_id = roasting_methods.id
    ''')
    SELECT_ONE: ClassVar[str] = SELECT_ALL + 'WHERE past_logs.id = %s\n'
    INSERT: ClassVar[str] = dedent('''\
        INSERT INTO past_logs (
            bean_name, process, target_roast_level,
            roasting_method_id, brewing_method_id,
            roasting_notes, grinder_setting, rating_score, general_notes
        ) VALUES (
            %(bean_name)s, %(process)s, %(target_roast_level)s,
            %(roasting_method_id)s, %(brewing_method_id)s,
            %(roasting_notes)s, %(grinder_setting)s, %(rating_score)s, %(general_notes)s
        ) RETURNING id
    ''')
    UPDATE: ClassVar[str] = dedent('''\
        UPDATE past_logs SET
            bean_name = %(bean_name)s,
            process = %(process)s,
            target_roast_level = %(target_roast_level)s,
            roasting_method_id = %(roasting_method_id)s,
            brewing_method_id = %(brewing_method_id)s,
            roasting_notes = %(roasting_notes)s,
            grinder_setting = %(grinder_setting)s,
            rating_score = %(rating_score)s,
            general_notes = %(general_notes)s
        WHERE id = %(id)s
    ''')
    DELETE: ClassVar[str] = 'DELETE FROM past_logs WHERE id = %s'
    SERVER_FIELDS: ClassVar[frozenset[str]] = frozenset({
        'brewing_method_name', 'roasting_method_name', 'date_logged',
    })
    _JOINED_FIELDS: ClassVar[frozenset[str]] = frozenset({
        'brewing_method_name', 'roasting_method_name',
    })

    id: int | None = None
    bean_name: str
    process: str
    target_roast_level: OptionalText = ''
    roasting_method_id: int
    brewing_method_id: int
    roasting_notes: OptionalText = ''
    grinder_setting: str
    rating_score: Annotated[int, Field(ge=0, le=5)]
    general_notes: OptionalText = ''
    date_logged: datetime | None = None
    brewing_method_name: OptionalText = ''
    roasting_method_name: OptionalText = ''
