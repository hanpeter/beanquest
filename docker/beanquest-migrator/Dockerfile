FROM ghcr.io/amacneil/dbmate:2.38.1@sha256:b0c8a87bfef4f2819fdb0a68ca357a44d12fb90d23eca695fcfc3b7e159cb1c5 AS dbmate

FROM gcr.io/distroless/static-debian13:nonroot AS runtime

WORKDIR /beanquest

COPY --from=dbmate /usr/local/bin/dbmate /usr/local/bin/dbmate
COPY db/migrations/ ./db/migrations/

ENV DBMATE_NO_DUMP_SCHEMA=true

ENTRYPOINT ["/usr/local/bin/dbmate", "--wait"]
CMD ["migrate"]
