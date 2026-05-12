#!/bin/bash
helm install my-frontend ./helm/frontend --set env.API_URL=http://my-backend.default.127.0.0.1.sslip.io
