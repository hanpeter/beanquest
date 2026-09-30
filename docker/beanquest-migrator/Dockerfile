FROM ghcr.io/amacneil/dbmate:2.36.0@sha256:520c740c6e0ad73fde2cd1ea7e2b779aaf789d22aca8858f87a478e7094535fb AS dbmate

FROM gcr.io/distroless/static-debian13:nonroot AS runtime

WORKDIR /beanquest

COPY --from=dbmate /usr/local/bin/dbmate /usr/local/bin/dbmate
COPY db/migrations/ ./db/migrations/

ENV DBMATE_NO_DUMP_SCHEMA=true

ENTRYPOINT ["/usr/local/bin/dbmate", "--wait"]
CMD ["migrate"]
