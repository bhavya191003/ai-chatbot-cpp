# Use Ubuntu as the base operating system
FROM ubuntu:22.04

# Avoid user interaction prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Install the C++ compiler, CPR library, and download tools
RUN apt-get update && apt-get install -y \
    g++ \
    libcpr-dev \
    libssl-dev \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set our working directory inside the container
WORKDIR /app

# Download the header-only Crow framework directly
RUN wget https://github.com/CrowCpp/Crow/releases/latest/download/crow_all.h -O /usr/include/crow.h

# Copy your C++ code into the container
COPY main.cpp .

# Compile the server (using -lpthread because Linux requires it for multi-threading)
RUN g++ -std=c++17 main.cpp -o server -lcpr -lpthread

# Expose the port your app runs on
EXPOSE 8000

# Tell the container how to start the server
CMD ["./server"]