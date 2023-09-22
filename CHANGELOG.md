# Changelog

All notable changes to this project will be documented in this file.

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
