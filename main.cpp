#include <crow.h>
#include <cpr/cpr.h>
#include <string>
#include <cstdlib>
#include <iostream>

std::string process_message(const std::string& user_message, const std::string& api_key) {
    std::string url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=" + api_key;
    
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
    
    CROW_LOG_ERROR << "Gemini API Failed. Status: " << r.status_code << " | Response: " << r.text;
    
    return "Error: Could not reach the AI. Status code: " + std::to_string(r.status_code);
}

int main() {
    const char* key_ptr = std::getenv("GEMINI_API_KEY");
    if (key_ptr == nullptr) {
        std::cerr << "Error: GEMINI_API_KEY is not set!" << std::endl;
        return 1;
    }
    std::string api_key(key_ptr);

    crow::SimpleApp app;

    CROW_ROUTE(app, "/chat").methods(crow::HTTPMethod::POST, crow::HTTPMethod::OPTIONS)([&api_key](const crow::request& req) {
        if (req.method == crow::HTTPMethod::OPTIONS) {
            crow::response res;
            res.add_header("Access-Control-Allow-Origin", "*");
            res.add_header("Access-Control-Allow-Methods", "POST, OPTIONS");
            res.add_header("Access-Control-Allow-Headers", "Content-Type");
            res.code = 204;
            return res;
        }

        auto x = crow::json::load(req.body);
        if (!x || !x.has("user_message")) {
            crow::response res;
            res.code = 400;
            return res;
        }

        std::string user_msg = x["user_message"].s();
        std::string mode = (x.has("mode")) ? x["mode"].s() : std::string("chat");
        crow::json::wvalue res_json;

        if (mode == "image") {
            std::string encoded_prompt = user_msg;
            size_t pos = 0;
            while ((pos = encoded_prompt.find(" ", pos)) != std::string::npos) {
                 encoded_prompt.replace(pos, 1, "%20");
                 pos += 3;
            }
            res_json["image_url"] = "https://image.pollinations.ai/prompt/" + encoded_prompt;
        } else {
            res_json["bot_reply"] = process_message(user_msg, api_key);
        }

        crow::response res(res_json.dump());
        res.add_header("Access-Control-Allow-Origin", "*");
        res.code = 200;
        return res;
    });

    app.port(8000).multithreaded().run();
}