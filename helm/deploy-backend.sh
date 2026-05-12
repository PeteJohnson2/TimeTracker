#!/bin/bash
helm install my-backend ./helm/backend --set env.DB_HOST=my-postgres