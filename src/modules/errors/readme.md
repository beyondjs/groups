# Errors Module

## Overview

The `Errors` module provides an enumeration-based system to manage error types and their associated messages. It comes
with an `ModelError` class that encapsulates error information, making it easier to handle and propagate errors
throughout the application.

ModelError integrates well with the error handling strategy. It allows for encapsulating complex error information and
makes the error more interpretable. Using enum-based error codes enhances consistency across the application.

## Features

-   Enum-based error codes.
-   Error message templating.
-   Extended error logging.

## Usage

To include this module in your project, import it as follows:

```typescript
import * as errors from '@aimpact/ailearn-api/errors';
```

### Defining Error Codes

Error codes are defined using TypeScript enumerations.

```typescript
export /*bundle*/ enum db {
	InternalError = 1,
	DocumentNotFound
}
```

### Using ModelError Class

Create a new error object:

```typescript
const error = new ModelError({ code: ErrorCodes.db.DocumentNotFound, literals: ['Assessment', assessmentId] });
```

## API Reference

-   `IErrorConstructor`: Type definition for constructing error objects.
-   `ModelError`: Class for encapsulating error data.
