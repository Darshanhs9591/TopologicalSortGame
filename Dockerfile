# Use lightweight Python image
FROM python:3

# Set working directory inside container
WORKDIR /app

# Copy all local files into the container
COPY . .

# Expose port 5000 to outside
EXPOSE 5000

# Command to run simple Python HTTP server
CMD ["python", "-m", "http.server", "5000"]
