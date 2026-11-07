FROM ghcr.io/amacneil/dbmate:2.37.0@sha256:0101fcc9999596f4a6930e5627296cd91f3bfa225e3e8c1699fc00881e439cc6 AS dbmate

FROM gcr.io/distroless/static-debian13:nonroot AS runtime

WORKDIR /beanquest

COPY --from=dbmate /usr/local/bin/dbmate /usr/local/bin/dbmate
COPY db/migrations/ ./db/migrations/

ENV DBMATE_NO_DUMP_SCHEMA=true

ENTRYPOINT ["/usr/local/bin/dbmate", "--wait"]
CMD ["migrate"]
