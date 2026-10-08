FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
RUN apt-get update -qq && apt-get install -y --no-install-recommends -qq wget tzdata \
  && rm -rf /var/lib/apt/lists/*
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false TZ=Asia/Tehran ASPNETCORE_URLS=http://0.0.0.0:5000
COPY publish/ ./
EXPOSE 5000
ENTRYPOINT ["dotnet", "Application.dll"]
