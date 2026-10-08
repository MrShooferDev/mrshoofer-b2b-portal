FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
RUN apt-get update -qq && apt-get install -y --no-install-recommends -qq wget   && rm -rf /var/lib/apt/lists/*
ENV ASPNETCORE_URLS=http://0.0.0.0:5005
COPY publish/ ./
EXPOSE 5005
ENTRYPOINT ["dotnet", "Application.dll"]
