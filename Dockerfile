# Use Ubuntu as the base operating system
FROM ubuntu:22.04

# Avoid prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Install build tools, git, and cURL dependencies
RUN apt-get update && apt-get install -y \
    g++ \
    cmake \
    git \
    libssl-dev \
    libcurl4-openssl-dev \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Download and build the CPR library from source
RUN git clone https://github.com/libcpr/cpr.git /cpr \
    && cd /cpr \
    && mkdir build && cd build \
    && cmake .. -DCPR_USE_SYSTEM_CURL=ON -DBUILD_SHARED_LIBS=OFF -DCPR_BUILD_TESTS=OFF \
    && make \
    && make install

# Set our working directory inside the container
WORKDIR /app

# Download the header-only Crow framework
RUN wget https://github.com/CrowCpp/Crow/releases/latest/download/crow_all.h -O /usr/include/crow.h

# Copy your C++ code into the container
COPY main.cpp .

# Compile the server (linking curl, cpr, and pthread)
RUN g++ -std=c++17 main.cpp -o server -lcpr -lcurl -lpthread

# Expose the port your app runs on
EXPOSE 8000

# Tell the container how to start the server
CMD ["./server"]