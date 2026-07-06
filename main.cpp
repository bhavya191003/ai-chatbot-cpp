#include <crow.h>
#include <crow/middlewares/cors.h> // 1. Include the native CORS header
#include <cpr/cpr.h>
#include <string>
#include <cstdlib>
#include <iostream>

// Note: The custom add_cors helper function has been completely removed 
// since the global middleware injects headers automatically.

std::string process_message(const std::string& user_message, const std::string& api_key) {
    std::string url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + api_key;
    crow::json::wvalue text_part;
    text_part["text"] = user_message;
    crow::json::wvalue content;
    content["parts"] = crow::json::wvalue::list({text_part});
    crow::json::wvalue gemini_req;
    gemini_req["contents"] = crow::json::wvalue::list({content});

    cpr::Response r = cpr::Post(cpr::Url{url},
                                cpr::Header{{"Content-Type", "application/json"}},
                                cpr::Body{gemini_req.dump()});

    if (r.status_code == 200) {
        auto gemini_res = crow::json::load(r.text);
        if (gemini_res && gemini_res.has("candidates")) {
            return gemini_res["candidates"][0]["content"]["parts"][0]["text"].s();
        }
    }
    return "API Error (" + std::to_string(r.status_code) + "): " + r.text;
}

int main() {
    // 2. Change crow::SimpleApp to crow::App with the CORSHandler middleware
    crow::App<crow::CORSHandler> app;

    // 3. Configure the CORS rules globally
    auto& cors = app.get_middleware<crow::CORSHandler>();
    cors.global()
        .origin("*")
        .methods("POST"_method, "OPTIONS"_method)
        .headers("Content-Type", "Accept", "Authorization");

    // 4. Keep your route focused strictly on handling your POST data
    CROW_ROUTE(app, "/chat").methods(crow::HTTPMethod::POST)([](const crow::request& req) {
        auto env_key = std::getenv("GEMINI_API_KEY");
        std::string api_key = env_key ? env_key : "";

        auto json_input = crow::json::load(req.body);
        if (!json_input || !json_input.has("user_message") || !json_input.has("mode")) {
            return crow::response(400, "Invalid payload");
        }

        std::string user_message = json_input["user_message"].s();
        std::string mode = json_input["mode"].s();
        crow::json::wvalue response_json;

        if (mode == "image") {
            std::string encoded_prompt = user_message;
            size_t pos = 0;
            while ((pos = encoded_prompt.find(" ", pos)) != std::string::npos) {
                 encoded_prompt.replace(pos, 1, "%20");
                 pos += 3;
            }
            response_json["image_url"] = "https://image.pollinations.ai/prompt/" + encoded_prompt;
        } else {
            response_json["bot_reply"] = process_message(user_message, api_key);
        }

        return crow::response(response_json);
    });

    auto port_env = std::getenv("PORT");
    uint16_t port = port_env ? std::stoi(port_env) : 8000;
    app.port(port).bindaddr("0.0.0.0").multithreaded().run();
}