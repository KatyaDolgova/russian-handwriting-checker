using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace RussianHandwritingChecker.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentsController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<DocumentsController> _logger;

        public DocumentsController(IHttpClientFactory httpClientFactory, ILogger<DocumentsController> logger)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("Файл не предоставлен.");
            }

            if (!file.ContentType.StartsWith("image/"))
            {
                return BadRequest("Файл должен быть изображением.");
            }

            using var httpClient = _httpClientFactory.CreateClient("OCRClient");

            // Подготовка multipart/form-data запроса к FastAPI
            using var content = new MultipartFormDataContent();
            using var fileStream = file.OpenReadStream();
            using var streamContent = new StreamContent(fileStream);
            streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType);
            content.Add(streamContent, "file", file.FileName);

            try
            {
                // Вызов FastAPI OCR-сервиса
                var response = await httpClient.PostAsync("http://localhost:8000/ocr/process-image/", content);

                if (response.IsSuccessStatusCode)
                {
                    var jsonResponse = await response.Content.ReadAsStringAsync();
                    // Возвращаем ответ от OCR-сервиса клиенту
                    return Content(jsonResponse, "application/json");
                }
                else
                {
                    _logger.LogError($"Ошибка от OCR-сервиса: {response.StatusCode}");
                    return StatusCode(500, "Ошибка при обработке изображения внешним сервисом.");
                }
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Ошибка при подключении к OCR-сервису.");
                return StatusCode(500, "Не удалось подключиться к OCR-сервису.");
            }
        }
    }
}