# csv-to-kotlin-dataclass README

Simple open source extension to generate a kotlin data class from a CSV file. It tries to determine the type of the data from what is available; it's not going to be perfect, but it should help find a good starting point given large CSV data.

Currently it only examines the first 300 rows for determining column type, to limit how long the file generation will take. This could someday be a setting.

## Extension Settings

Nothing for now; later, we'll see :)


