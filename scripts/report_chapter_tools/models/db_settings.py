
class DbSettings:
   """
   Database connection properties
   """
   db_name: str
   hostname: str
   password: str
   port: int|None
   unix_socket: str|None
   username: str

   def __init__(self, db_name: str, password: str, username: str, 
                hostname: str|None, port: int|None = None, 
                unix_socket: str|None = None):
      self.db_name = db_name
      self.password = password
      self.port = port
      self.unix_socket = unix_socket
      self.username = username

      if hostname is None or len(hostname) < 1:
         hostname = "localhost"
      self.hostname = hostname
