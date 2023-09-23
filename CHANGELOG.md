# Changelog

All notable changes to this project will be documented in this file.

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
