# Test-O-Matiq

> **Warning**
> Under development!

---

> **Note** > **Please check out the [Wiki section](https://github.com/Informatiqal/test-o-matiq/wiki) for details and examples**

The core for data testing framework for Qlik Sense apps

## Introduction

Data testing (especially regression testing) is usually boring and time consuming job. There are different approaches for automate/semi-automate data testing.

`Test-O-Matiq` is design to be ran against Qlik Sense app. The package will execute user defined set of tests. The tests are split in few main areas:

- Meta - test the overall status of an app
  - Data model
    - Fields - list of fields to be present in the app
    - Tables - list of tables to be present in the app
    - Synthetic keys - synthetic keys are allowed or not in the app
    - Always one selected - list of fields, for which `qOneAndOnlyOne` property should be present
  - Fields - list of fields exists and the count of their distinct values is matching an expected number
  - Tables - list of tables exists and the count of their rows is matching an expected number
  - Variables
- Lists - check for values presence in fields
- Tables - build data table from user defined dimensions and expressions and compare the result with expected values
- Scalar - result of "one line" expressions is compared with user defined expected result
- Objects - if specified viz objects exists in the app

## Installation

Install the package from npm

```shell
npm install --save test-o-matiq
```

> **Warning**
> `test-o-matiq` accepts a valid json input and an instance of a Qlik app. But the app instance should have [enigma-mixin](https://github.com/countnazgul/enigma-mixin) added

## Usage

```javascript
// NodeJS (pseudo) example
import { TestOMatiq } from "test-o-matiq";

import { docMixin } from "enigma-mixin";
import * as enigma from "enigma.js";
import * as schema from "enigma.js/schemas/12.20.0.json";
import WebSocket from "ws";

const config = {
  schema: schema,
  mixins: docMixin,
  url: "ws://localhost:4848/app/engineData",
  createSocket: (url) => new WebSocket(url),
};

const session = enigma.create(config);
const global = await session.open();
const app = await global.openDoc(`some-app-id`);

const testSuite = {
  description: "Test if table exists",
  version: "0.0.1",
  spec: {
    Meta: {
      DataModel: {
        Table: ["Table Name"],
      },
    },
  },
};

const testOMatiq = new TestOMatiq(testSuite, app);
const result = await testOMatiq.run();
```

`result` variable will have the following data:
![result](./assets//result.png)

Check the Wiki section for details

## Solutions

- [Test-O-Matiq CLI](https://github.com/Informatiqal/test-o-matiq-cli) - command line tool that runs test suites, from YAML files
- Test-O-Matiq Web - TBA

## Code documentation

[Dev documentation](https://informatiqal.github.io/test-o-matiq/classes/TestOMatiq.html)
