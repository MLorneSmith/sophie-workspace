[Skip to main content](https://developer.pdf.co/api/pdf-forms-info-reader/index.html#main-content)

Back to top

`Ctrl` + `K`

[Login](https://app.pdf.co/login) [Sign Up](https://app.pdf.co/signup) [**Dashboard**](https://app.pdf.co/)

**Your Credits**

[Add More](https://app.pdf.co/subscriptions)

# PDF Forms Info Reader [\#](https://developer.pdf.co/api/pdf-forms-info-reader/index.html#pdf-forms-info-reader 'Permalink to this heading')

Get information about fillable form fields inside a **PDF** file.

Note

For one-time check of **PDF** file information and find form fields please use [PDF Edit Add Helper](https://app.pdf.co/pdf-edit-add-helper).

## Available Methods [\#](https://developer.pdf.co/api/pdf-forms-info-reader/index.html#available-methods 'Permalink to this heading')

- [/pdf/info/fields](https://developer.pdf.co/api/pdf-forms-info-reader/index.html#post-tag-pdf-info-fields)

## /pdf/info/fields [\#](https://developer.pdf.co/api/pdf-forms-info-reader/index.html#post-tag-pdf-info-fields 'Permalink to this heading')

Extracts information about fillable **PDF** fields (fillable edit boxes, fillable check-boxes, radio buttons, combo-boxes) from input **PDF** file along with general information about the input **PDF** document. The purpose of this endpoint is to get information about fillable **PDFs** for use with **PDF.co** [PDF Add](https://developer.pdf.co/api/pdf-add/index.html#pdf-edit-add) method.

- **Method:** POST

- **Endpoint:** /v1/pdf/info/fields

### Attributes [\#](https://developer.pdf.co/api/pdf-forms-info-reader/index.html#attributes 'Permalink to this heading')

Note

Attributes are _case-sensitive_ and should be inside JSON for POST request, for example:

```
{
    "url": "https://example.com/file1.pdf"
}

```

Copy to clipboard

| Attribute      | Description                                                                                                                                                                                                                                                                                                                             | Required |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `url`          | URL to the source file. [1](https://developer.pdf.co/api/pdf-forms-info-reader/index.html#f1)                                                                                                                                                                                                                                           | _yes_    |
| `httpusername` | HTTP auth user name if required to access source `url`.                                                                                                                                                                                                                                                                                 | _no_     |
| `httppassword` | HTTP auth password if required to access source `url`.                                                                                                                                                                                                                                                                                  | _no_     |
| `password`     | Password of PDF file, the input must be in string format.                                                                                                                                                                                                                                                                               | _no_     |
| `async`        | Set `async` to `true` for long processes to run in the background, API will then return a `jobId` which you can use with the [Background Job Check](https://developer.pdf.co/api/background-job-check/index.html#job-check) endpoint to check the status of the process and retrieve the output while you can proceed with other tasks. | _no_     |
| `profiles`     | Use this parameter to set additional configurations for fine-tuning and extra options. Explore the [Profiles](https://developer.pdf.co/api/profiles/index.html#api-profiles) section for more.                                                                                                                                          | _no_     |

### Query parameters [\#](https://developer.pdf.co/api/pdf-forms-info-reader/index.html#query-parameters 'Permalink to this heading')

_No query parameters accepted._

### Payload [3](https://developer.pdf.co/api/pdf-forms-info-reader/index.html#f3) [\#](https://developer.pdf.co/api/pdf-forms-info-reader/index.html#example-tag-payload 'Permalink to this heading')

```
{
  "url": "https://pdfco-test-files.s3.us-west-2.amazonaws.com/pdf-form/f1040.pdf",
  "async": false
}

```

Copy to clipboard

### Response [2](https://developer.pdf.co/api/pdf-forms-info-reader/index.html#f2) [\#](https://developer.pdf.co/api/pdf-forms-info-reader/index.html#example-tag-response 'Permalink to this heading')

```
{
  "info": {
        "PageCount": 3,
        "Author": "SE:W:CAR:MP",
        "Title": "2019 Form 1040",
        "Producer": "macOS Version 10.15.1 (Build 19B88) Quartz PDFContext",
        "Subject": "U.S. Individual Income Tax Return",
        "CreationDate": "8/7/2020 11:17:29 AM",
        "Bookmarks": "",
        "Keywords": "Fillable",
        "Creator": "Adobe LiveCycle Designer ES 9.0",
        "Encrypted": false,
        "PasswordProtected": false,
        "PageRectangle": {
            "Location": {
                "IsEmpty": true,
                "X": 0,
                "Y": 0
            },
            "Size": "612, 792",
            "X": 0,
            "Y": 0,
            "Width": 612,
            "Height": 792,
            "Left": 0,
            "Top": 0,
            "Right": 612,
            "Bottom": 792,
            "IsEmpty": false
        },
        "ModificationDate": "8/7/2020 11:17:29 AM",
        "EncryptionAlgorithm": "None",
        "PermissionPrinting": true,
        "PermissionModifyDocument": true,
        "PermissionContentExtraction": true,
        "PermissionModifyAnnotations": true,
        "PermissionFillForms": true,
        "PermissionAccessibility": true,
        "PermissionAssemble": true,
        "PermissionHighQualityPrint": true,
        "FieldsInfo": {
            "Fields": [\
                {\
                    "PageIndex": 1,\
                    "Type": "CheckBox",\
                    "FieldName": "topmostSubform[0].Page1[0].FilingStatus[0].c1_01[3]",\
                    "Value": "False",\
                    "Left": 340.39898681640625,\
                    "Top": 67.99798583984375,\
                    "Width": 8,\
                    "Height": 8\
                },\
                {\
                    "PageIndex": 1,\
                    "Type": "CheckBox",\
                    "FieldName": "topmostSubform[0].Page1[0].FilingStatus[0].c1_01[4]",\
                    "Value": "False",\
                    "Left": 441.1990051269531,\
                    "Top": 67.99798583984375,\
                    "Width": 8,\
                    "Height": 8\
                },\
                {\
                    "PageIndex": 1,\
                    "Type": "EditBox",\
                    "FieldName": "topmostSubform[0].Page1[0].f1_03[0]",\
                    "Value": "",\
                    "Left": 238.60000610351562,\
                    "Top": 111.9990234375,\
                    "Width": 228.39999389648438,\
                    "Height": 14.0009765625\
                },\
                {\
                    "PageIndex": 2,\
                    "Type": "EditBox",\
                    "FieldName": "topmostSubform[0].Page2[0].PaidPreparer[0].Preparer[0].f2_37[0]",\
                    "Value": "",\
                    "Left": 509.7449951171875,\
                    "Top": 474.0010070800781,\
                    "Width": 66.2550048828125,\
                    "Height": 11.998992919921875\
                }\
            ]
        }
    },
    "error": false,
    "status": 200,
    "remainingCredits": 59987
}

```

Copy to clipboard

### CURL [\#](https://developer.pdf.co/api/pdf-forms-info-reader/index.html#curl 'Permalink to this heading')

```
curl --location --request POST 'https://api.pdf.co/v1/pdf/info/fields' \
--header 'x-api-key: *******************' \
--header 'Content-Type: application/json' \
--data-raw '{
    "url": "https://pdfco-test-files.s3.us-west-2.amazonaws.com/pdf-form/f1040.pdf",
    "async": false
}'

```

Copy to clipboard

---

## Code samples [\#](https://developer.pdf.co/api/pdf-forms-info-reader/index.html#code-samples 'Permalink to this heading')

JavaScript / Node.js

```
var request = require('request');

// You can also upload your own file into PDF.co and use it as url. Check "Upload File" samples for code snippets: https://github.com/bytescout/pdf-co-api-samples/tree/master/File%20Upload/
var options = {
  'method': 'POST',
  'url': 'https://api.pdf.co/v1/pdf/info/fields',
  'headers': {
    'x-api-key': '{{x-api-key}}'
  },
  formData: {
    'url': 'https://bytescout-com.s3-us-west-2.amazonaws.com/files/demo-files/cloud-api/pdf-form/f1040.pdf'
  }
};
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});

```

Copy to clipboard

Python

```
import os
import requests # pip install requests

# The authentication key (API Key).
# Get your own by registering at https://app.pdf.co
API_KEY = "***************************"

# Base URL for PDF.co Web API requests
BASE_URL = "https://api.pdf.co/v1"

# Source PDF file url. You can also upload your own file into PDF.co and use it as url. Check "Upload File" samples for code snippets: https://github.com/bytescout/pdf-co-api-samples/tree/master/File%20Upload/
SourceFileURL = "https://pdf-temp-files.s3.amazonaws.com/R2FBM39LFX1BFC860O06XU0TL613JTZ9/f1040-form-filled.pdf "
Async = "False"

# Destination PDF file name
DestinationFile = ".\\result.pdf"

parameters = {}
parameters["async"] = Async
parameters["name"] = os.path.basename(DestinationFile)
parameters["url"] = SourceFileURL

# Prepare URL for 'Info Fields' API request
url = "{}/pdf/info/fields".format(BASE_URL)

response = requests.post(url, data=parameters, headers={ "x-api-key": API_KEY })

if (response.status_code == 200):
    json = response.json()
for field in json["info"]["FieldsInfo"]["Fields"]:print(field["FieldName"] + "=>" + field["Value"])

```

Copy to clipboard

C#

```
using System;
using RestSharp;
namespace HelloWorldApplication {
    class HelloWorld {
        static void Main(string[] args) {
            var client = new RestClient("https://api.pdf.co/v1/pdf/info/fields");
            client.Timeout = -1;
            var request = new RestRequest(Method.POST);
            request.AddHeader("x-api-key", "{{x-api-key}}");
            request.AlwaysMultipartFormData = true;

            // You can also upload your own file into PDF.co and use it as url. Check "Upload File" samples for code snippets: https://github.com/bytescout/pdf-co-api-samples/tree/master/File%20Upload/
            request.AddParameter("url", "https://bytescout-com.s3-us-west-2.amazonaws.com/files/demo-files/cloud-api/pdf-form/f1040.pdf");
            IRestResponse response = client.Execute(request);
            Console.WriteLine(response.Content);
        }
    }
}

```

Copy to clipboard

Java

```
import java.io.*;
import okhttp3.*;
public class main {
    public static void main(String []args) throws IOException{
        OkHttpClient client = new OkHttpClient().newBuilder()
            .build();
        MediaType mediaType = MediaType.parse("text/plain");
          // You can also upload your own file into PDF.co and use it as url. Check "Upload File" samples for code snippets: https://github.com/bytescout/pdf-co-api-samples/tree/master/File%20Upload/
        RequestBody body = new MultipartBody.Builder().setType(MultipartBody.FORM)
            .addFormDataPart("url", "https://bytescout-com.s3-us-west-2.amazonaws.com/files/demo-files/cloud-api/pdf-form/f1040.pdf")
            .build();
        Request request = new Request.Builder()
            .url("https://api.pdf.co/v1/pdf/info/fields")
            .method("POST", body)
            .addHeader("x-api-key", "{{x-api-key}}")
            .build();
        Response response = client.newCall(request).execute();
        System.out.println(response.body().string());
    }
}

```

Copy to clipboard

PHP

```
todo
<?php

$curl = curl_init();

// You can also upload your own file into PDF.co and use it as url. Check "Upload File" samples for code snippets: https://github.com/bytescout/pdf-co-api-samples/tree/master/File%20Upload/
curl_setopt_array($curl, array(
    CURLOPT_URL => "https://api.pdf.co/v1/pdf/info/fields",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => "",
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 0,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => "POST",
    CURLOPT_POSTFIELDS => array('url' => 'https://bytescout-com.s3-us-west-2.amazonaws.com/files/demo-files/cloud-api/pdf-form/f1040.pdf'),
    CURLOPT_HTTPHEADER => array(
        "x-api-key: {{x-api-key}}"
    ),
));

$response = json_decode(curl_exec($curl));

curl_close($curl);
echo "<h2>Output:</h2><pre>", var_export($response, true), "</pre>";

var request = require('request');

// You can also upload your own file into PDF.co and use it as url. Check "Upload File" samples for code snippets: https://github.com/bytescout/pdf-co-api-samples/tree/master/File%20Upload/
var options = {
  'method': 'POST',
  'url': 'https://api.pdf.co/v1/pdf/info/fields',
  'headers': {
    'x-api-key': '{{x-api-key}}'
  },
  formData: {
    'url': 'https://bytescout-com.s3-us-west-2.amazonaws.com/files/demo-files/cloud-api/pdf-form/f1040.pdf'
  }
};
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});

```

Copy to clipboard

### On Github [\#](https://developer.pdf.co/api/pdf-forms-info-reader/index.html#on-github 'Permalink to this heading')

- [JavaScript samples](https://github.com/bytescout/pdf-co-api-samples/tree/master/PDF%20Forms%20Info%20Reader/JavaScript/Read%20PDF%20Form%20Information)

- [Python samples](https://github.com/bytescout/pdf-co-api-samples/tree/master/PDF%20Forms%20Info%20Reader/Python/Read%20PDF%20Form%20Information)

- [C# samples](https://github.com/bytescout/pdf-co-api-samples/tree/master/PDF%20Forms%20Info%20Reader/C%23/Read%20PDF%20Form%20Information)

- [Java samples](https://github.com/bytescout/pdf-co-api-samples/tree/master/PDF%20Forms%20Info%20Reader/Java/Read%20PDF%20Form%20Information)

- [PHP samples](https://github.com/bytescout/pdf-co-api-samples/tree/master/PDF%20Forms%20Info%20Reader/PHP/Read%20PDF%20Form%20Information)

- [PowerShell samples](https://github.com/bytescout/pdf-co-api-samples/tree/master/PDF%20Forms%20Info%20Reader/PowerShell/Read%20PDF%20Form%20Information)

- [Salesforce samples](https://github.com/bytescout/pdf-co-api-samples/tree/master/PDF%20Forms%20Info%20Reader/Salesforce/Read%20PDF%20Form%20Information)

- [cURL samples](https://github.com/bytescout/pdf-co-api-samples/tree/master/PDF%20Forms%20Info%20Reader/cURL/Read%20PDF%20Form%20Information)

Footnotes

[1](https://developer.pdf.co/api/pdf-forms-info-reader/index.html#id2)

Supports publicly accessible links from any source, including [Google Drive](https://drive.google.com/), [Dropbox](https://dropbox.com/), and [PDF.co Built-In Files Storage](https://app.pdf.co/files). To upload files via the API, check out the [File Upload](https://developer.pdf.co/api/file-upload/index.html#file-upload) section. **Note**: If you experience intermittent [Access Denied or Too Many Requests](https://developer.pdf.co/knowledgebase/errors/index.html#access-denied-or-too-many-requests) errors, please try adding `cache:` to enable built-in URL caching (e.g., `cache:https://example.com/file1.pdf`). **For data security**, you have the option to **encrypt output files** and **decrypt input files**. Learn more about [user-controlled data encryption](https://developer.pdf.co/security/user-controlled-encryption.html#security-user-controlled-encryption).

[2](https://developer.pdf.co/api/pdf-forms-info-reader/index.html#id4)

Main response codes as follows:

| Code  | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `200` | _Success_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `400` | _Bad request_. Typically happens because of bad input parameters, or because the input URLs can’t be reached, possibly due to access restrictions like needing a login or password.                                                                                                                                                                                                                                                                                                                                 |
| `401` | _Unauthorized_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `402` | _Not enough credits_                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `445` | _Timeout error_. To process large documents or files please use asynchronous mode (set the `async` parameter to `true`) and then check status using the [/job/check](https://developer.pdf.co/api/background-job-check/index.html#post-tag-job-check) endpoint. If a file contains many pages then specify a page range using the `pages` parameter. The number of pages of the document can be obtained using the [/pdf/info](https://developer.pdf.co/api/pdf-info-reader/index.html#post-tag-pdf-info) endpoint. |

Note

For more see [the complete list of available response codes](https://developer.pdf.co/api/response-codes/index.html#response-codes).

[3](https://developer.pdf.co/api/pdf-forms-info-reader/index.html#id3)

**PDF.co Request size**: API requests do not support request sizes of more than `4` megabytes in size. Please ensure that request sizes do not exceed this limit.

Was this page helpful?
YesNo

### Are you a human?

What is 9 + 7?

Close

---

This website uses cookies for functional and analytical purposes. By continuing, you agree
to our cookie use. Please read our
[privacy policy](https://pdf.co/resources/legal/privacy)
for more information.

I Agree

On this page
