
Vagrant.configure("2") do |config|
  desired_directory = "/var/www/game-server"
  config.ssh.shell = "bash -c 'cd #{desired_directory}; exec bash'"
	config.vm.box = "bento/ubuntu-22.04"
  config.vm.network "private_network", ip: "192.168.33.10"
  config.vm.network "forwarded_port", guest: 8000, host: 8000
  config.vm.synced_folder ".", "/var/www/game-server" # Sync current folder to VM

  config.vm.hostname = "game-server-local"
  config.vm.provider "virtualbox" do |vb|
    vb.customize ["modifyvm", :id, "--natdnshostresolver1", "on"]
		vb.customize ["modifyvm", :id, "--natdnsproxy1", "on"]
    vb.customize [ "guestproperty", "set", :id, "/VirtualBox/GuestAdd/VBoxService/--timesync-set-threshold", 10000 ]
		vb.name = "game-server-local"
    vb.memory = "1024"  # 1mb seems to be plenty for this project
    vb.cpus = 1
  end
  
  config.vm.provision "shell", inline: <<-SHELL
    # Basic updates and package installations
    sudo apt-get update
    sudo apt-get install -y git net-tools dos2unix
    sudo apt-get -y install nginx

    # MariaDB installation
    curl -LsS https://r.mariadb.com/downloads/mariadb_repo_setup | sudo bash -s -- --mariadb-server-version="mariadb-10.11"
    apt-get -y install mariadb-server mariadb-client

    # Install node 
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - &&\
    sudo apt-get install -y nodejs

    # Create database
    sudo mysql --user=root --execute="CREATE DATABASE gameLocal;"

    # Add user for the database
    sudo mysql --user=root --execute="CREATE USER 'admin'@'localhost' IDENTIFIED BY 'test'; GRANT ALL PRIVILEGES ON *.* TO 'admin'@'localhost' WITH GRANT OPTION;"
    sudo mysql --user=root --execute="SET GLOBAL group_concat_max_len = 370000;"
    sudo service mysql restart

    sudo npm i -g nodemon
    sudo npm i -g ts-node
    sudo npm install --no-bin-links

    # Run migrations
    cd /var/www/game-server
    sudo bash initialize_local_db.sh

    # Change starting directory for both users root / vagrant
    echo "cd /var/www/game-server" >> /root/.bashrc
    echo "cd /var/www/game-server" >> /home/vagrant/.bashrc

  SHELL

end
