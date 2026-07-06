# Use Ubuntu as the base operating system
FROM ubuntu:22.04

# Avoid prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Install build tools, git, python3, asio, and cURL dependencies
RUN apt-get update && apt-get install -y \
    g++ \
    cmake \
    git \
    python3 \
    libssl-dev \
    libcurl4-openssl-dev \
    libasio-dev \
    wget \
    && rm -rf /var/lib/apt/lists/*

# 1. Download and build the CPR library from source
RUN git clone https://github.com/libcpr/cpr.git /cpr \
    && cd /cpr \
    && mkdir build && cd build \
    && cmake .. -DCPR_USE_SYSTEM_CURL=ON -DBUILD_SHARED_LIBS=OFF -DCPR_BUILD_TESTS=OFF \
    && make \
    && make install

# 2. Clone Crow and generate the 'crow_all.h' header file
RUN git clone https://github.com/CrowCpp/Crow.git /crow \
    && cd /crow/scripts \
    && python3 merge_all.py ../include /usr/include/crow.h

# Set our working directory
WORKDIR /app

# Copy your C++ code into the container
COPY main.cpp .

# Compile the server with the necessary Asio flags
# -DASIO_STANDALONE tells Crow to use the system Asio
# -I/usr/include/asio ensures it finds the header file
RUN g++ -std=c++17 main.cpp -o server -DASIO_STANDALONE -I/usr/include/asio -lcpr -lcurl -lssl -lcrypto -lpthread
# Expose the port your app runs on
EXPOSE 8000

# Tell the container how to start the server
CMD ["./server"]