# Changelog

All notable changes to this project will be documented in this file.

## [0.9.1] - 2024-01-02

- check connection method (to be utilized in the CLI package)
- Engine port and host are passed from the config
- Engine will use the `apiKey` from the config (if provided) when connecting with Qlik
- [BUG] fixed bug where variation was not calculated when the result was not an expression

## [0.9.0] - 2023-12-31

- Multi-app testing - make selections in multiple apps and compare results between apps [#137](https://github.com/Informatiqal/test-o-matiq/issues/137)
- dependency updates

## [0.8.0] - 2023-12-21

- Option to specify result variation [#140](https://github.com/Informatiqal/test-o-matiq/issues/140). For more info check the [documentation section](https://docs.informatiqal.com/test-o-matiq/structure/spec/data/#variations)

## [0.7.0] - 2023-12-21

- dependency updates
- Scalar - option to compare with multiple results [#182](https://github.com/Informatiqal/test-o-matiq/issues/182)

## [0.6.0] - 2023-11-08

- Qlik alternate states - it is possible to define alternate states in the test suite and data tests selections sections AND in the scalar tests. State is optional and if not defined then all selections/evaluations are performed into the default state `$`

## [0.5.0] - 2023-10-22

- added additional meta checks for existing master items:
    - dimensions
    - measures
    - visualizations
- dependency updates

## [0.4.6] - 2023-10-17

- fix potential issue where props selections might not be passed
- the schema now requires `environment` property to be provided
- generate schema VSCode task

## [0.4.5] - 2023-10-16

- fix and update the return data (to be consistent)
- fix and update the emitters. At the moment the only emit event that is raised is when task is complete. In the near future more events will be added (like `debug`)
- general small codebase refactoring
- dependency updates

## [0.4.1] - 2023-09-24

- [#124](https://github.com/Informatiqal/test-o-matiq/issues/124) the json schema is updated to include the latest changes (mostly related to the selections section)

## [0.4.1] - 2023-09-23

- internal change - base abstract class for the data tests (list and scalar)

## [0.4.0] - 2023-09-23

- lists testing is brought inline with the scalar testing codebase
- table testing is turned off ... for now. [#145](https://github.com/Informatiqal/test-o-matiq/issues/145) is the issue to follow the progress. At the moment more analysis is needed. The initial impression is that table testing might be more complicated to implement than anticipated ... or at least some scope should be included instead of going in too much details (from where the complication comes)

## [0.3.0] - 2023-09-22

- [#155](https://github.com/Informatiqal/test-o-matiq/issues/155) Ability to skip single tests and/or whole test suites
- dependency updates

## [0.0.6] - 2023-01-11

- for Scalar tests
    - the comparison respects the type of the expression and result (string or number)
    - result can be an expression as well
- the json schema can be generated directly from the typescript interfaces/types
- re-write of the EventBus to correctly define the emitted types

## [0.0.6] - 2023-01-10

- Initial release
    - main structure in place
    - initial version of `Meta` tests implemented
    - initial version of `Data -> Tests` implemented
        - `Scalar` and `List` are in place
    - some form of output is generated
