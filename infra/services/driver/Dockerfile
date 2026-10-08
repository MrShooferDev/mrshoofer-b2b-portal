FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY publish/ ./
RUN chmod +x Driver.Web 2>/dev/null || true
ENV ASPNETCORE_URLS=http://0.0.0.0:57679
EXPOSE 57679
ENTRYPOINT ["./Driver.Web"]
