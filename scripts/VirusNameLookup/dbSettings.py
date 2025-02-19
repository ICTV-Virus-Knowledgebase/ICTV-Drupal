

# Settings that can be used to create a MariaDB database connection.
class DbSettings:

   # The database name, hostname, password, port, and username.
   dbName: str
   hostname: str
   password: str
   port: int
   username: str

   #--------------------------------------------------------------------------------------------------------
   # C-tor
   #--------------------------------------------------------------------------------------------------------
   def __init__(self, dbName_: str, hostname_: str, password_: str, port_: int, username_: str):
      
      if dbName_ in (None, ""):
         raise Exception("Invalid database name")
      else:
         self.dbName = dbName_

      if hostname_ in (None, ""):
         raise Exception("Invalid database hostname")
      else:
         self.hostname = hostname_

      if password_ in (None, ""):
         raise Exception("Invalid database password")
      else:
         self.password = password_

      if not port_:
         raise Exception("Invalid database port")
      else:
         self.port = port_

      if username_ in (None, ""):
         raise Exception("Invalid database username")
      else:
         self.username = username_
