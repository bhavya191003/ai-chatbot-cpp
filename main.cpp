#include <crow.h>
#include <cpr/cpr.h>
#include <string>
#include <cstdlib>
#include <iostream>

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
    crow::SimpleApp app;

    // === 1. SANITY CHECK ROUTE ===
    // If you go to https://ai-chatbot-cpp.onrender.com/ in your browser, you should see this text.
    CROW_ROUTE(app, "/")([]() {
        return "SUCCESS! The C++ backend has updated and is running!";
    });

    // === 2. CHAT ROUTE ===
    CROW_ROUTE(app, "/chat").methods(crow::HTTPMethod::POST, crow::HTTPMethod::OPTIONS)
    ([](const crow::request& req) {
        crow::response res;
        
        // Universal CORS allowed for testing
        res.add_header("Access-Control-Allow-Origin", "*"); 
        res.add_header("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.add_header("Access-Control-Allow-Headers", "Content-Type");

        if (req.method == crow::HTTPMethod::OPTIONS) {
            res.code = 204;
            return res; // Safest return method for Crow
        }

        auto env_key = std::getenv("GEMINI_API_KEY");
        std::string api_key = env_key ? env_key : "";

        auto json_input = crow::json::load(req.body);
        if (!json_input || !json_input.has("user_message") || !json_input.has("mode")) {
            res.code = 400;
            res.body = R"({"error": "Invalid payload"})";
            return res;
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

        res.code = 200;
        res.body = response_json.dump();
        return res;
    });

    auto port_env = std::getenv("PORT");
    uint16_t port = port_env ? std::stoi(port_env) : 8000;
    app.port(port).bindaddr("0.0.0.0").multithreaded().run();
}