# EC2
## nvm and node
  ```sh
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
  ```
  ```sh
  . ~/.nvm/nvm.sh
  ```
  ```sh
  nvm install 16
  ```
  ```sh
  node -v
  npm -v
  ```
  ## docker on EC2 AWSLinux
  ```sh
  sudo yum update -y
  ```
  ```sh
  sudo amazon-linux-extras install docker
  ```
  ```sh
  sudo service docker start
  ```
  ```sh
  sudo systemctl enable docker
  ```
  ```sh
  sudo usermod -a -G docker ec2-user
  ```
  reopen ssh connect
  ```sh
  docker info
  ```
## git
  ```sh
  sudo yum install git
  ```
  ```sh
  git version 
  ```
  ```sh
  git clone https://github.com/Alllllen/mqtt.git
  ```
  ## Run Mosca
  ```sh
  cd mqtt
  ```
  ```sh
  npm i 
  ```
  ```sh
  node brokerAedes.js
  ```
  
