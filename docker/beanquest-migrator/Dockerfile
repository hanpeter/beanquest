FROM ghcr.io/amacneil/dbmate:2.38.2@sha256:fb4fe7cabfe98cf864d63ce083867f3c303a8c1a022fcd69081439425706e909 AS dbmate

FROM gcr.io/distroless/static-debian13:nonroot AS runtime

WORKDIR /beanquest

COPY --from=dbmate /usr/local/bin/dbmate /usr/local/bin/dbmate
COPY db/migrations/ ./db/migrations/

ENV DBMATE_NO_DUMP_SCHEMA=true

ENTRYPOINT ["/usr/local/bin/dbmate", "--wait"]
CMD ["migrate"]
