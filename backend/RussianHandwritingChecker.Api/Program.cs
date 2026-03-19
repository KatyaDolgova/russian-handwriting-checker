using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ====================== CORS ======================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",
            "http://127.0.0.1:3000"
            //"https://мой-домен.ру"   
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});
// =================================================

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Russian Handwriting Checker API", Version = "v1" });
});

// HttpClient для вызова Python OCR
builder.Services.AddHttpClient("OCRClient", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["OCRService:BaseUrl"] ?? "http://localhost:8000");
    client.Timeout = TimeSpan.FromSeconds(30);
});

var app = builder.Build();

// ====================== Middleware ======================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowReact");           
app.UseAuthorization();
app.MapControllers();

app.Run();