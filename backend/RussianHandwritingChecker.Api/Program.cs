using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers(); // Добавляем поддержку контроллеров

// Настройка Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer(); // Необходимо для Swagger
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Russian Handwriting Checker API", Version = "v1" });
    // Здесь можно добавить настройки документации (XML комментарии и т.д.)
});

// Добавляем HttpClientFactory для вызова внешних API (например, OCR-сервиса)
builder.Services.AddHttpClient();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection(); 
app.UseAuthorization();    // Для проверки JWT токенов (когда добавишь)

// Маршрутизация к контроллерам
app.MapControllers(); 

// Пример встроенного эндпоинта (не через контроллер)
var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast")
.WithOpenApi();

app.Run(); // Запуск приложения

// Запись (record) для модели прогноза погоды 
record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}