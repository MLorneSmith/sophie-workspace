[Skip to main content](https://developer.pdf.co/api/introduction/index.html#main-content)

 Back to top

`Ctrl` + `K`

[Login](https://app.pdf.co/login) [Sign Up](https://app.pdf.co/signup) [**Dashboard**](https://app.pdf.co/)

**Your Credits**

[Add More](https://app.pdf.co/subscriptions)

# Getting Started [\#](https://developer.pdf.co/api/introduction/index.html\#getting-started "Permalink to this heading")

Introducing the general concepts for using the PDF.co API, authentication methods, response codes and sample code.

## API Reference [\#](https://developer.pdf.co/api/introduction/index.html\#api-reference "Permalink to this heading")

The PDF.co Web API is REST-based, making it intuitive and easy to use. To prioritize your data’s security and privacy, all requests are securely transmitted using HTTPS. Kindly note, unsecured HTTP connections are not supported.

All requests contain the following **base URL**:

`https://api.pdf.co/v1`

## Authenticating Your API Request [\#](https://developer.pdf.co/api/introduction/index.html\#authenticating-your-api-request "Permalink to this heading")

To authenticate you need to add a header named `x-api-key` using your API Key as the value.

```
"x-api-key": "sample@sample.com_123a4b567c890d123e456f789g01"

```

Copy to clipboard

Note

The key provided above is just a sample and won’t work for actual API calls. Don’t forget to replace it with your real API Key, which you can find in your [PDF.co Dashboard](https://app.pdf.co/), when making requests.

## Response codes [\#](https://developer.pdf.co/api/introduction/index.html\#response-codes "Permalink to this heading")

After making a request you will receive a response from the **PDF.co** API. A code `200` means the request was successfull, a `400` means there was an error. However there could be other codes - see [the complete list of available response codes](https://developer.pdf.co/api/response-codes/index.html#response-codes).

## Sample Code [\#](https://developer.pdf.co/api/introduction/index.html\#sample-code "Permalink to this heading")

Here is some sample code which would convert a **PDF** to a **CSV** file.

JavaScript

```
var data = {
              "url": "https://pdfco-test-files.s3.us-west-2.amazonaws.com/pdf-to-csv/sample.pdf",
              "lang": "eng",
              "inline": true,
              "pages": "0-",
              "async": false,
              "name": "result.csv"
            }

fetch('https://api.pdf.co/v1/pdf/convert/to/csv', {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': 'sample@sample.com_123a4b567c890d123e456f789g01'
    },
    body: JSON.stringify(data)
})
   .then(response => response.json())
   .then(response => console.log(JSON.stringify(response)))

```

Copy to clipboard

curl

```
curl --location --request POST 'https://api.pdf.co/v1/pdf/convert/to/csv' \
--header 'Content-Type: application/json' \
--header 'x-api-key: sample@sample.com_123a4b567c890d123e456f789g01' \
--data-raw '{
    "url": "https://pdfco-test-files.s3.us-west-2.amazonaws.com/pdf-to-csv/sample.pdf",
    "lang": "eng",
    "inline": true,
    "pages": "0-",
    "async": false,
    "name": "result.csv"
}'

```

Copy to clipboard

Was this page helpful?
YesNo

### Are you a human?

What is 7 + 9?

Close

* * *

This website uses cookies for functional and analytical purposes. By continuing, you agree
to our cookie use. Please read our
[privacy policy](https://pdf.co/resources/legal/privacy)
for more information.

I Agree

On this page

[iframe](https://td.doubleclick.net/td/rul/936954131?random=1744037944149&cv=11&fst=1744037944149&fmt=3&bg=ffffff&guid=ON&async=1&gtm=45be5421v9178924140z872476096za200zb72476096&gcd=13r3r3r3r5l1&dma=0&tag_exp=102509682~102788824~102803279~102813109~102887799~102926062~102975949~103016951~103021830~103027016&u_w=1280&u_h=720&url=https%3A%2F%2Fdeveloper.pdf.co%2Fapi%2Fintroduction%2Findex.html&hn=www.googleadservices.com&frm=0&tiba=Getting%20Started%20%E2%80%94%20pdf.co%20documentation&npa=0&pscdl=noapi&auid=1335395896.1744037944&uaa=x86&uab=64&uafvl=Chromium%3B131.0.6778.33%7CNot_A%2520Brand%3B24.0.0.0&uamb=0&uam=&uap=Windows&uapv=10.0&uaw=0&fledge=1&data=event%3Dgtag.config)[iframe](https://td.doubleclick.net/td/ga/rul?tid=G-FJJWDFCD9X&gacid=502565858.1744037944&gtm=45je5421v9104111730z872476096za200zb72476096&dma=0&gcs=G111&gcd=13r3r3r3r5l1&npa=0&pscdl=noapi&aip=1&fledge=1&frm=0&tag_exp=102509683~102788824~102803279~102813109~102887799~102926062~102975949~103016951~103021830~103027016&z=1538586287)

![](https://bat.bing.com/action/0?ti=4069547&tm=gtm002&Ver=2&mid=9bbda26b-792f-4681-8284-260468b9908e&bo=1&sid=d904ed7013c011f0b6ffabeb4c659c3e&vid=d904eb6013c011f0b5d6bb068e8d1dc9&vids=1&msclkid=N&uach=pv%3D10.0&pi=918639831&lg=en-US&sw=1280&sh=720&sc=24&tl=Getting%20Started%20%E2%80%94%20pdf.co%20documentation&kw=pdf,%20document,%20api,%20split,%20merge,%20zapier,%20make&p=https%3A%2F%2Fdeveloper.pdf.co%2Fapi%2Fintroduction%2Findex.html&r=&lt=987&evt=pageLoad&sv=1&cdb=AQAQ&rn=378437)
