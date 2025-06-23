[Skip to main content](https://developer.pdf.co/api/pdf-filler/index.html#main-content)

 Back to top

`Ctrl` + `K`

[Login](https://app.pdf.co/login) [Sign Up](https://app.pdf.co/signup) [**Dashboard**](https://app.pdf.co/)

**Your Credits**

[Add More](https://app.pdf.co/subscriptions)

# PDF Filler [\#](https://developer.pdf.co/api/pdf-filler/index.html\#pdf-filler "Permalink to this heading")

This uses the [PDF Add](https://developer.pdf.co/api/pdf-add/index.html#pdf-edit-add) API.

## Create Fillable PDF Forms [\#](https://developer.pdf.co/api/pdf-filler/index.html\#create-fillable-pdf-forms "Permalink to this heading")

You can create fillable **PDF** forms by adding editable text boxes and checkboxes.

By using the [annotations\[\]](https://developer.pdf.co/api/pdf-add/index.html#pdf-add-annotations) attribute and setting the `type` to `textfield` or `checkbox` you can create form elements to be placed on your **PDF**.

### Payload [3](https://developer.pdf.co/api/pdf-filler/index.html\#f3) [\#](https://developer.pdf.co/api/pdf-filler/index.html\#example-tag-payload "Permalink to this heading")

```
{
    "async": false,
    "inline": true,
    "name": "newDocument",
    "url": "https://pdfco-test-files.s3.us-west-2.amazonaws.com/pdf-edit/sample.pdf",
    "annotations":[\
       {\
            "text":"sample prefilled text",\
            "x": 10,\
            "y": 30,\
            "size": 12,\
            "pages": "0-",\
            "type": "TextField",\
            "id": "textfield1"\
        },\
        {\
            "x": 100,\
            "y": 150,\
            "size": 12,\
            "pages": "0-",\
            "type": "Checkbox",\
            "id": "checkbox2"\
        },\
        {\
            "x": 100,\
            "y": 170,\
            "size": 12,\
            "pages": "0-",\
            "link": "https://pdfco-test-files.s3.us-west-2.amazonaws.com/pdf-edit/logo.png",\
            "type": "CheckboxChecked",\
            "id":"checkbox3"\
        }\
\
    ]
}

```

Copy to clipboard

### Response [2](https://developer.pdf.co/api/pdf-filler/index.html\#f2) [\#](https://developer.pdf.co/api/pdf-filler/index.html\#example-tag-response "Permalink to this heading")

```
{
    "url": "https://pdf-temp-files.s3-us-west-2.amazonaws.com/d5c6efa549194ffaacb2eedd318e0320/newDocument.pdf?X-Amz-Expires=3600&x-amz-security-token=FwoGZXIvYXdzECMaDJJV7qKrpnGUrZHrwSKBATR5rxVlQoU0zj3r4jyHPt7yj4HoCIBi65IbMRWVX8qZZtKL9YGUzP%2FcemlqVd4Vi5%2B80Sg%2BymqQtaQ8qSFqKA82JnV%2BNBDatIigZIZha%2BrQM3jSC%2FZhX1zxsfLLsaH3K5nBnkjT3gi%2FZnx%2FgqrlIhf3m2xRFaTlgHrBADlK9KKPIijSusD4BTIo%2FQ433xx%2FQEaGWdX0nu4NuiByyXNPsBCAI3im9LMUCujjqF79ocyLHA%3D%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIA4NRRSZPHCSWKUQ4T/20200716/us-west-2/s3/aws4_request&X-Amz-Date=20200716T092641Z&X-Amz-SignedHeaders=host;x-amz-security-token&X-Amz-Signature=2aa88d39aaf4b5891e4cb42d5675a64486098558d7159b37b75252209bdd6a95",
    "pageCount": 1,
    "error": false,
    "status": 200,
    "name": "newDocument",
    "remainingCredits": 77762
}

```

Copy to clipboard

### CURL [\#](https://developer.pdf.co/api/pdf-filler/index.html\#curl "Permalink to this heading")

```
curl --location --request POST 'https://api.pdf.co/v1/pdf/edit/add' \
--header 'Content-Type: application/json' \
--header 'x-api-key: *******************' \
--data-raw '{
    "async": false,
        "inline": true,
    "name": "newDocument",
    "url": "https://pdfco-test-files.s3.us-west-2.amazonaws.com/pdf-edit/sample.pdf",
    "annotations":[\
       {\
            "text":"sample prefilled text",\
            "x": 10,\
            "y": 30,\
            "size": 12,\
            "pages": "0-",\
            "type": "TextField",\
            "id": "textfield1"\
        },\
        {\
            "x": 100,\
            "y": 150,\
            "size": 12,\
            "pages": "0-",\
            "type": "Checkbox",\
            "id": "checkbox2"\
        },\
        {\
            "x": 100,\
            "y": 170,\
            "size": 12,\
            "pages": "0-",\
            "link": "https://pdfco-test-files.s3.us-west-2.amazonaws.com/pdf-edit/logo.png",\
            "type": "CheckboxChecked",\
            "id":"checkbox3"\
        }\
\
    ]
}'

```

Copy to clipboard

* * *

## Fill PDF Forms [\#](https://developer.pdf.co/api/pdf-filler/index.html\#fill-pdf-forms "Permalink to this heading")

You can fill existing form fields in a PDF after identifying the form field names.

Once form fields are identified then the [fields\[\]](https://developer.pdf.co/api/pdf-add/index.html#pdf-add-fields) attribute should be used to populate the fields by `fieldName`.

### Payload [3](https://developer.pdf.co/api/pdf-filler/index.html\#f3) [\#](https://developer.pdf.co/api/pdf-filler/index.html\#id4 "Permalink to this heading")

```
{
  "async": false,
  "inline": true,
  "name": "f1040-filled",
  "url": "https://pdfco-test-files.s3.us-west-2.amazonaws.com/pdf-form/f1040.pdf",
  "fields": [\
      {\
          "fieldName": "topmostSubform[0].Page1[0].FilingStatus[0].c1_01[1]",\
          "pages": "1",\
          "text": "True"\
      },\
      {\
\
          "fieldName": "topmostSubform[0].Page1[0].f1_02[0]",\
          "pages": "1",\
          "text": "John A."\
      },\
      {\
\
          "fieldName": "topmostSubform[0].Page1[0].f1_03[0]",\
          "pages": "1",\
          "text": "Doe"\
      },\
      {\
          "fieldName": "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_04[0]",\
          "pages": "1",\
          "text": "123456789"\
      },\
      {\
          "fieldName": "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_05[0]",\
          "pages": "1",\
          "text": "Joan B.",\
          "fontName": "Arial",\
          "size": 6,\
          "fontBold": true,\
          "fontItalic": true,\
          "fontStrikeout": true,\
          "fontUnderline": true\
      },\
      {\
          "fieldName": "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_05[0]",\
          "pages": "1",\
          "text": "Joan B."\
      },\
      {\
          "fieldName": "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_06[0]",\
          "pages": "1",\
          "text": "Doe"\
      },\
      {\
          "fieldName": "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_07[0]",\
          "pages": "1",\
          "text": "987654321"\
      }\
  ]

```

Copy to clipboard

### Response [2](https://developer.pdf.co/api/pdf-filler/index.html\#f2) [\#](https://developer.pdf.co/api/pdf-filler/index.html\#id6 "Permalink to this heading")

```
{
    "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "url": "https://pdf-temp-files.s3.amazonaws.com/cd15a09771554bed88d6419c1e2f2b16/f1040-filled.pdf",
    "pageCount": 3,
    "error": false,
    "status": 200,
    "name": "f1040-filled.pdf",
    "remainingCredits": 99999369,
    "credits": 63
}

```

Copy to clipboard

### CURL [\#](https://developer.pdf.co/api/pdf-filler/index.html\#id7 "Permalink to this heading")

```
curl --location --request POST 'https://api.pdf.co/v1/pdf/edit/add' \
--header 'Content-Type: application/json' \
--header 'x-api-key: *******************' \
--data-raw '{
    "async": false,
    "inline": true,
    "name": "f1040-filled",
    "url": "https://pdfco-test-files.s3.us-west-2.amazonaws.com/pdf-form/f1040.pdf",
    "fields": [\
        {\
            "fieldName": "topmostSubform[0].Page1[0].FilingStatus[0].c1_01[1]",\
            "pages": "1",\
            "text": "True"\
        },\
        {\
\
            "fieldName": "topmostSubform[0].Page1[0].f1_02[0]",\
            "pages": "1",\
            "text": "John A."\
        },\
        {\
\
            "fieldName": "topmostSubform[0].Page1[0].f1_03[0]",\
            "pages": "1",\
            "text": "Doe"\
        },\
        {\
            "fieldName": "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_04[0]",\
            "pages": "1",\
            "text": "123456789"\
        },\
        {\
            "fieldName": "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_05[0]",\
            "pages": "1",\
            "text": "Joan B.",\
            "fontName": "Arial",\
            "size": 6,\
            "fontBold": true,\
            "fontItalic": true,\
            "fontStrikeout": true,\
            "fontUnderline": true\
        },\
        {\
            "fieldName": "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_05[0]",\
            "pages": "1",\
            "text": "Joan B."\
        },\
        {\
            "fieldName": "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_06[0]",\
            "pages": "1",\
            "text": "Doe"\
        },\
        {\
            "fieldName": "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_07[0]",\
            "pages": "1",\
            "text": "987654321"\
        }\
    ],
    "annotations":[\
        {\
            "text":"Sample Filled with PDF.co API using /pdf/edit/add. Get fields from forms using /pdf/info/fields. This text is be added on the first (0) and the last (!0) pages.",\
            "x": 400,\
            "y": 10,\
            "width": 200,\
            "height": 500,\
            "size": 12,\
            "pages": "0-",\
            "color": "FF0000",\
            "link": "https://pdf.co"\
        }\
    ]
  }'

```

Copy to clipboard

* * *

## Code samples [\#](https://developer.pdf.co/api/pdf-filler/index.html\#code-samples "Permalink to this heading")

JavaScript / Node.js

```
var https = require("https");
var path = require("path");
var fs = require("fs");

// The authentication key (API Key).
// Get your own by registering at https://app.pdf.co
const API_KEY = "***********************************";

// Direct URL of source PDF file.
const SourceFileUrl = "https://bytescout-com.s3-us-west-2.amazonaws.com/files/demo-files/cloud-api/pdf-form/f1040.pdf";

// PDF document password. Leave empty for unprotected documents.
const Password = "";

// Destination PDF file name
const DestinationFile = "./result.pdf";

// Runs processing asynchronously. Returns Use JobId that you may use with /job/check to check state of the processing (possible states: working, failed, aborted and success). Must be one of: true, false.
const async = false;

// Form field data
var fields = [\
    {\
        "fieldName": "topmostSubform[0].Page1[0].FilingStatus[0].c1_01[1]",\
        "pages": "1",\
        "text": "True"\
    },\
    {\
        "fieldName": "topmostSubform[0].Page1[0].f1_02[0]",\
        "pages": "1",\
        "text": "John A."\
    },\
    {\
        "fieldName": "topmostSubform[0].Page1[0].f1_03[0]",\
        "pages": "1",\
        "text": "Doe"\
    },\
    {\
        "fieldName": "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_04[0]",\
        "pages": "1",\
        "text": "123456789"\
    },\
    {\
        "fieldName": "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_05[0]",\
        "pages": "1",\
        "text": "Joan B."\
    },\
    {\
        "fieldName": "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_05[0]",\
        "pages": "1",\
        "text": "Joan B."\
    },\
    {\
        "fieldName": "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_06[0]",\
        "pages": "1",\
        "text": "Doe"\
    },\
    {\
        "fieldName": "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_07[0]",\
        "pages": "1",\
        "text": "987654321"\
    }\
];

// * Fill forms *
// Prepare request to `PDF Edit` API endpoint
var queryPath = `/v1/pdf/edit/add`;

// JSON payload for api request
var jsonPayload = JSON.stringify({
    name: path.basename(DestinationFile),
    password: Password,
    url: SourceFileUrl,
    async: async,
    fields: fields
});

var reqOptions = {
    host: "api.pdf.co",
    method: "POST",
    path: queryPath,
    headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(jsonPayload, 'utf8')
    }
};
// Send request
var postRequest = https.request(reqOptions, (response) => {
    response.on("data", (d) => {
        // Parse JSON response
        var data = JSON.parse(d);

        if (data.error == false) {
            // Download the PDF file
            var file = fs.createWriteStream(DestinationFile);
            https.get(data.url, (response2) => {
                response2.pipe(file).on("close", () => {
                    console.log(`Generated PDF file saved to '${DestinationFile}' file.`);
                });
            });
        }
        else {
            // Service reported error
            console.log(data.message);
        }
    });
}).on("error", (e) => {
    // Request error
    console.error(e);
});

// Write request data
postRequest.write(jsonPayload);
postRequest.end();

```

Copy to clipboard

Python

```
import os
import requests # pip install requests

# The authentication key (API Key).
# Get your own by registering at https://app.pdf.co
API_KEY = "**************************************"

# Base URL for PDF.co Web API requests
BASE_URL = "https://api.pdf.co/v1"

def main(args = None):
    fillPDFForm()

def fillPDFForm():
    """Fill PDF form using PDF.co Web API"""

    # Prepare requests params as JSON
    # See documentation: https://developer.pdf.co
    payload = "{\n    \"async\": false,\n    \"encrypt\": false,\n    \"name\": \"f1040-filled\",\n    \"url\": \"https://bytescout-com.s3-us-west-2.amazonaws.com/files/demo-files/cloud-api/pdf-form/f1040.pdf\",\n    \"fields\": [\n        {\n            \"fieldName\": \"topmostSubform[0].Page1[0].FilingStatus[0].c1_01[1]\",\n            \"pages\": \"1\",\n            \"text\": \"True\"\n        },\n        {\n            \"fieldName\": \"topmostSubform[0].Page1[0].f1_02[0]\",\n            \"pages\": \"1\",\n            \"text\": \"John A.\"\n        },        \n        {\n            \"fieldName\": \"topmostSubform[0].Page1[0].f1_03[0]\",\n            \"pages\": \"1\",\n            \"text\": \"Doe\"\n        },        \n        {\n            \"fieldName\": \"topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_04[0]\",\n            \"pages\": \"1\",\n            \"text\": \"123456789\"\n        },\n        {\n            \"fieldName\": \"topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_05[0]\",\n            \"pages\": \"1\",\n            \"text\": \"Joan B.\"\n        },\n        {\n            \"fieldName\": \"topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_05[0]\",\n            \"pages\": \"1\",\n            \"text\": \"Joan B.\"\n        },\n        {\n            \"fieldName\": \"topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_06[0]\",\n            \"pages\": \"1\",\n            \"text\": \"Doe\"\n        },\n        {\n            \"fieldName\": \"topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_07[0]\",\n            \"pages\": \"1\",\n            \"text\": \"987654321\"\n        }     \n\n\n\n    ],\n    \"annotations\":[\n        {\n            \"text\":\"Sample Filled with PDF.co API using /pdf/edit/add. Get fields from forms using /pdf/info/fields\",\n            \"x\": 10,\n            \"y\": 10,\n            \"size\": 12,\n            \"pages\": \"0-\",\n            \"color\": \"FFCCCC\",\n            \"link\": \"https://pdf.co\"\n        }\n    ],    \n    \"images\": [        \n    ]\n}"

    # Prepare URL for 'Fill PDF' API request
    url = "{}/pdf/edit/add".format(BASE_URL)

    # Execute request and get response as JSON
    response = requests.post(url, data=payload, headers={"x-api-key": API_KEY, 'Content-Type': 'application/json'})
    if (response.status_code == 200):
        json = response.json()

        if json["error"] == False:
            #  Get URL of result file
            resultFileUrl = json["url"]
            # Download result file
            r = requests.get(resultFileUrl, stream=True)
            if (r.status_code == 200):
                with open(destinationFile, 'wb') as file:
                    for chunk in r:
                        file.write(chunk)
                print(f"Result file saved as \"{destinationFile}\" file.")
            else:
                print(f"Request error: {response.status_code} {response.reason}")
        else:
            # Show service reported error
            print(json["message"])
    else:
        print(f"Request error: {response.status_code} {response.reason}")

if __name__ == '__main__':
    main()

```

Copy to clipboard

C#

```
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Net;
using System.Runtime.InteropServices;

namespace PDFcoApiExample
{
    class Program
    {
        // The authentication key (API Key).
        // Get your own by registering at https://app.pdf.co
        const String API_KEY = "*************************";

        // Direct URL of source PDF file.
        const string SourceFileUrl = "https://bytescout-com.s3-us-west-2.amazonaws.com/files/demo-files/cloud-api/pdf-form/f1040.pdf";
        // PDF document password. Leave empty for unprotected documents.
        const string Password = "";
        // File name for generated output. Must be a String
        const string FileName = "f1040-form-filled";

        // Destination File Name
        const string DestinationFile = "./result.pdf";

        static void Main(string[] args)
        {
            // Create standard .NET web client instance
            WebClient webClient = new WebClient();

            // Set API Key
            webClient.Headers.Add("x-api-key", API_KEY);

            // Values to fill out pdf fields with built-in pdf form filler
            var fields = new List<object> {
                new { fieldName = "topmostSubform[0].Page1[0].FilingStatus[0].c1_01[1]", pages = "1", text = "True" },
                new { fieldName = "topmostSubform[0].Page1[0].f1_02[0]", pages = "1", text = "John A." },
                new { fieldName = "topmostSubform[0].Page1[0].f1_03[0]", pages = "1", text = "Doe" },
                new { fieldName = "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_04[0]", pages = "1", text = "123456789" },
                new { fieldName = "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_05[0]", pages = "1", text = "John  B." },
                new { fieldName = "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_06[0]", pages = "1", text = "Doe" },
                new { fieldName = "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_07[0]", pages = "1", text = "987654321" }
            };

            // If enabled, Runs processing asynchronously. Returns Use JobId that you may use with /job/check to check state of the processing (possible states: working,
            var async = false;

            // Prepare requests params as JSON
            // See documentation: https://developer.pdf.co
            Dictionary<string, object> parameters = new Dictionary<string, object>();
            parameters.Add("url", SourceFileUrl);
            parameters.Add("name", FileName);
            parameters.Add("password", Password);
            parameters.Add("async", async);
            parameters.Add("fields", fields);

            // Convert dictionary of params to JSON
            string jsonPayload = JsonConvert.SerializeObject(parameters);

            try
            {
                // URL of "PDF Edit" endpoint
                string url = "https://api.pdf.co/v1/pdf/edit/add";

                // Execute POST request with JSON payload
                string response = webClient.UploadString(url, jsonPayload);

                // Parse JSON response
                JObject json = JObject.Parse(response);

                if (json["error"].ToObject<bool>() == false)
                {
                    // Get URL of generated PDF file
                    string resultFileUrl = json["url"].ToString();

                    // Download generated PDF file
                    webClient.DownloadFile(resultFileUrl, DestinationFile);

                    Console.WriteLine("Generated PDF file saved as \"{0}\" file.", DestinationFile);
                }
                else
                {
                    Console.WriteLine(json["message"].ToString());
                }
            }
            catch (WebException e)
            {
                Console.WriteLine(e.ToString());
            }
            finally
            {
                webClient.Dispose();
            }

            Console.WriteLine();
            Console.WriteLine("Press any key...");
            Console.ReadKey();
        }
    }
}

```

Copy to clipboard

Java

```
package com.company;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import okhttp3.*;

import java.io.*;
import java.net.*;
import java.nio.file.Path;
import java.nio.file.Paths;

public class Main
{
    // The authentication key (API Key).
    // Get your own by registering at https://app.pdf.co
    final static String API_KEY = "****************************";

    // Direct URL of source PDF file.
    final static String SourceFileUrl = "bytescout-com.s3-us-west-2.amazonaws.com/files/demo-files/cloud-api/pdf-form/f1040.pdf";
    // PDF document password. Leave empty for unprotected documents.
    final static String Password = "";

    // Destination PDF file name
    final static Path ResultFile = Paths.get(".\\result.pdf");

    public static void main(String[] args) throws IOException
    {
        // Create HTTP client instance
        OkHttpClient webClient = new OkHttpClient();

        // Prepare URL for `PDF Edit` API call
        String query = "https://api.pdf.co/v1/pdf/edit/add";

        // Prepare form filling data
        String fields = "[\n" +\
                "        {\n" +\
                "            \"fieldName\": \"topmostSubform[0].Page1[0].FilingStatus[0].c1_01[1]\",\n" +\
                "            \"pages\": \"1\",\n" +\
                "            \"text\": \"True\"\n" +\
                "        },\n" +\
                "        {\n" +\
                "            \"fieldName\": \"topmostSubform[0].Page1[0].f1_02[0]\",\n" +\
                "            \"pages\": \"1\",\n" +\
                "            \"text\": \"John A.\"\n" +\
                "        },        \n" +\
                "        {\n" +\
                "            \"fieldName\": \"topmostSubform[0].Page1[0].f1_03[0]\",\n" +\
                "            \"pages\": \"1\",\n" +\
                "            \"text\": \"Doe\"\n" +\
                "        },        \n" +\
                "        {\n" +\
                "            \"fieldName\": \"topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_04[0]\",\n" +\
                "            \"pages\": \"1\",\n" +\
                "            \"text\": \"123456789\"\n" +\
                "        },\n" +\
                "        {\n" +\
                "            \"fieldName\": \"topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_05[0]\",\n" +\
                "            \"pages\": \"1\",\n" +\
                "            \"text\": \"Joan B.\"\n" +\
                "        },\n" +\
                "        {\n" +\
                "            \"fieldName\": \"topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_05[0]\",\n" +\
                "            \"pages\": \"1\",\n" +\
                "            \"text\": \"Joan B.\"\n" +\
                "        },\n" +\
                "        {\n" +\
                "            \"fieldName\": \"topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_06[0]\",\n" +\
                "            \"pages\": \"1\",\n" +\
                "            \"text\": \"Doe\"\n" +\
                "        },\n" +\
                "        {\n" +\
                "            \"fieldName\": \"topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_07[0]\",\n" +\
                "            \"pages\": \"1\",\n" +\
                "            \"text\": \"987654321\"\n" +\
                "        }     \n" +\
                "    ]";

        // Asynchronous Job
        String async = "false";

        // Make correctly escaped (encoded) URL
        URL url = null;
        try
        {
            url = new URI(null, query, null).toURL();
        }
        catch (URISyntaxException e)
        {
            e.printStackTrace();
        }

        // Create JSON payload
        String jsonPayload = String.format("{\n" +
                "    \"url\": \"%s\",\n" +
                "    \"async\": %s,\n" +
                "    \"encrypt\": false,\n" +
                "    \"name\": \"f1040-filled\",\n" +
                "    \"fields\": %s"+
                "}", SourceFileUrl, async, fields);

        // Prepare request body
        RequestBody body = RequestBody.create(MediaType.parse("application/json"), jsonPayload);
        // Prepare request
        Request request = new Request.Builder()
                .url(url)
                .addHeader("x-api-key", API_KEY) // (!) Set API Key
                .addHeader("Content-Type", "application/json")
                .post(body)
                .build();

        // Execute request
        Response response = webClient.newCall(request).execute();

        if (response.code() == 200)
        {
            // Parse JSON response
            JsonObject json = new JsonParser().parse(response.body().string()).getAsJsonObject();

            boolean error = json.get("error").getAsBoolean();
            if (!error)
            {
                // Get URL of generated output file
                String resultFileUrl = json.get("url").getAsString();

                // Download the image file
                downloadFile(webClient, resultFileUrl, ResultFile);

                System.out.printf("Generated file saved to \"%s\" file.", ResultFile.toString());
            }
            else
            {
                // Display service reported error
                System.out.println(json.get("message").getAsString());
            }
        }
        else
        {
            // Display request error
            System.out.println(response.code() + " " + response.message());
        }
    }

    public static void downloadFile(OkHttpClient webClient, String url, Path destinationFile) throws IOException
    {
        // Prepare request
        Request request = new Request.Builder()
                .url(url)
                .build();
        // Execute request
        Response response = webClient.newCall(request).execute();

        byte[] fileBytes = response.body().bytes();

        // Save downloaded bytes to file
        OutputStream output = new FileOutputStream(destinationFile.toFile());
        output.write(fileBytes);
        output.flush();
        output.close();

        response.close();
    }
}

```

Copy to clipboard

PHP

```
<?php

  // Get submitted form data
  $apiKey = $_POST["apiKey"]; // The authentication key (API Key). Get your own by registering at https://app.pdf.co

  // Prepare URL for Fill PDF API call
  $url = "https://api.pdf.co/v1/pdf/edit/add";

  // Prepare requests params
  // See documentation: https://developer.pdf.co
  $parameters = array();

  // Direct URL of source PDF file.
  $parameters["url"] = "bytescout-com.s3-us-west-2.amazonaws.com/files/demo-files/cloud-api/pdf-form/f1040.pdf";

  // Name of resulting file
  $parameters["name"] = "f1040-form-filled";

  // If large input document, process in async mode by passing true
  $parameters["async"] = false;

  // Field Strings
  $fields =   '[{\
      "fieldName": "topmostSubform[0].Page1[0].FilingStatus[0].c1_01[1]",\
      "pages": "1",\
      "text": "True"\
  },\
  {\
      "fieldName": "topmostSubform[0].Page1[0].f1_02[0]",\
      "pages": "1",\
      "text": "John A."\
  },\
  {\
      "fieldName": "topmostSubform[0].Page1[0].f1_03[0]",\
      "pages": "1",\
      "text": "Doe"\
  },\
  {\
      "fieldName": "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_04[0]",\
      "pages": "1",\
      "text": "123456789"\
  },\
  {\
      "fieldName": "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_05[0]",\
      "pages": "1",\
      "text": "Joan B."\
  },\
  {\
      "fieldName": "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_05[0]",\
      "pages": "1",\
      "text": "Joan B."\
  },\
  {\
      "fieldName": "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_06[0]",\
      "pages": "1",\
      "text": "Doe"\
  },\
  {\
      "fieldName": "topmostSubform[0].Page1[0].YourSocial_ReadOrderControl[0].f1_07[0]",\
      "pages": "1",\
      "text": "987654321"\
  }]';// JSON string

  // Convert JSON string to Array
  $fieldsArray = json_decode($fields, true);

  $parameters["fields"] = $fieldsArray;

  // Create Json payload
  $data = json_encode($parameters);

  // Create request
  $curl = curl_init();
  curl_setopt($curl, CURLOPT_HTTPHEADER, array("x-api-key: " . $apiKey, "Content-type: application/json"));
  curl_setopt($curl, CURLOPT_URL, $url);
  curl_setopt($curl, CURLOPT_POST, true);
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($curl, CURLOPT_POSTFIELDS, $data);

  // Execute request
  $result = curl_exec($curl);

  if (curl_errno($curl) == 0)
  {
      $status_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);

      if ($status_code == 200)
      {
          $json = json_decode($result, true);

          if (!isset($json["error"]) || $json["error"] == false)
          {
              $resultFileUrl = $json["url"];

              // Display link to the file with conversion results
              echo "<div><h2>Result:</h2><a href='" . $resultFileUrl . "' target='_blank'>" . $resultFileUrl . "</a></div>";
          }
          else
          {
              // Display service reported error
              echo "<p>Error: " . $json["message"] . "</p>";
          }
      }
      else
      {
          // Display request error
          echo "<p>Status code: " . $status_code . "</p>";
          echo "<p>" . $result . "</p>";
      }
  }
  else
  {
      // Display CURL error
      echo "Error: " . curl_error($curl);
  }

  // Cleanup
  curl_close($curl);

?>

```

Copy to clipboard

### On Github [\#](https://developer.pdf.co/api/pdf-filler/index.html\#on-github "Permalink to this heading")

- [JavaScript samples](https://github.com/bytescout/pdf-co-api-samples/tree/master/PDF%20Fill%20PDF%20Forms/JavaScript)

- [Python samples](https://github.com/bytescout/pdf-co-api-samples/tree/master/PDF%20Fill%20PDF%20Forms/Python)

- [C# samples](https://github.com/bytescout/pdf-co-api-samples/tree/master/PDF%20Fill%20PDF%20Forms/C%23)

- [Java samples](https://github.com/bytescout/pdf-co-api-samples/tree/master/PDF%20Fill%20PDF%20Forms/Java)

- [PHP samples](https://github.com/bytescout/pdf-co-api-samples/tree/master/PDF%20Fill%20PDF%20Forms/PHP)

- [PowerShell samples](https://github.com/bytescout/pdf-co-api-samples/tree/master/PDF%20Fill%20PDF%20Forms/PowerShell)

- [Salesforce samples](https://github.com/bytescout/pdf-co-api-samples/tree/master/PDF%20Fill%20PDF%20Forms/Salesforce/Fill%20PDF%20Form)

- [cURL samples](https://github.com/bytescout/pdf-co-api-samples/tree/master/PDF%20Fill%20PDF%20Forms/cURL)

- [Google App Script](https://github.com/bytescout/pdf-co-api-samples/tree/master/PDF%20Fill%20PDF%20Forms/GoogleAppScript)

- [AWS Lambda](https://github.com/bytescout/pdf-co-api-samples/tree/master/PDF%20Fill%20PDF%20Forms/AWS%20Lambda)

- [VB.NET](https://github.com/bytescout/pdf-co-api-samples/tree/master/PDF%20Fill%20PDF%20Forms/VB.NET)

Footnotes

1

Supports publicly accessible links from any source, including [Google Drive](https://drive.google.com/), [Dropbox](https://dropbox.com/), and [PDF.co Built-In Files Storage](https://app.pdf.co/files). To upload files via the API, check out the [File Upload](https://developer.pdf.co/api/file-upload/index.html#file-upload) section. **Note**: If you experience intermittent [Access Denied or Too Many Requests](https://developer.pdf.co/knowledgebase/errors/index.html#access-denied-or-too-many-requests) errors, please try adding `cache:` to enable built-in URL caching (e.g., `cache:https://example.com/file1.pdf`). **For data security**, you have the option to **encrypt output files** and **decrypt input files**. Learn more about [user-controlled data encryption](https://developer.pdf.co/security/user-controlled-encryption.html#security-user-controlled-encryption).

2( [1](https://developer.pdf.co/api/pdf-filler/index.html#id2), [2](https://developer.pdf.co/api/pdf-filler/index.html#id5))

Main response codes as follows:

| Code | Description |
| --- | --- |
| `200` | _Success_ |
| `400` | _Bad request_. Typically happens because of bad input parameters, or because the input URLs can’t be reached, possibly due to access restrictions like needing a login or password. |
| `401` | _Unauthorized_ |
| `402` | _Not enough credits_ |
| `445` | _Timeout error_. To process large documents or files please use asynchronous mode (set the `async` parameter to `true`) and then check status using the [/job/check](https://developer.pdf.co/api/background-job-check/index.html#post-tag-job-check) endpoint. If a file contains many pages then specify a page range using the `pages` parameter. The number of pages of the document can be obtained using the [/pdf/info](https://developer.pdf.co/api/pdf-info-reader/index.html#post-tag-pdf-info) endpoint. |

Note

For more see [the complete list of available response codes](https://developer.pdf.co/api/response-codes/index.html#response-codes).

3( [1](https://developer.pdf.co/api/pdf-filler/index.html#id1), [2](https://developer.pdf.co/api/pdf-filler/index.html#id3))

**PDF.co Request size**: API requests do not support request sizes of more than `4` megabytes in size. Please ensure that request sizes do not exceed this limit.

Was this page helpful?
YesNo

### Are you a human?

What is 1 + 5?

Close

* * *

This website uses cookies for functional and analytical purposes. By continuing, you agree
to our cookie use. Please read our
[privacy policy](https://pdf.co/resources/legal/privacy)
for more information.

I Agree

On this page
