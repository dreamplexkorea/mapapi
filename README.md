# mapapi

This repository contains Google Apps Script code for the DREAMPLEX education plan generator. It also includes a utility (`transport.gs`) for fetching driving information between Daegu Station and a selected school using Google and Naver APIs.

## Endpoint

Deploy `transport.gs` as a web app and call:

```
https://script.google.com/macros/s/DEPLOY_ID/exec?function=doGetRoute&region=성주군&school=성주중학교
```

Parameters:
- `start` (optional): starting address, default "대구역".
- `goal` (optional): destination if not using `region` and `school`.
- `fuelEfficiency` (optional): km per liter, default `14`.
- `fuelPrice` (optional): fuel price per liter in KRW, default `1700`.

The response includes distance, duration, toll fare, fuel cost and total cost.
