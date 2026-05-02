import os
from dotenv import load_dotenv, find_dotenv
from pathlib import Path
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool

load_dotenv(find_dotenv())

POSTGRES_URL = os.getenv("POSTGRES_URL")

pool = None

def get_pool():
  global pool

  if pool is None:
    if not POSTGRES_URL:
      raise RuntimeError("POSTGRES_URL is not configured")

    pool = SimpleConnectionPool(
      minconn=1,
      maxconn=10,
      dsn=POSTGRES_URL
    )

  return pool

def execute(query, params=None, fetch_one=False, fetch_all=False):
  conn = None
  db_pool = get_pool()

  try:
    conn = db_pool.getconn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute(query, params or ())

    if fetch_one:
      result = cur.fetchone()
    elif fetch_all:
      result = cur.fetchall()
    else:
      result = None

    conn.commit()
    return result

  except Exception as e:
    if conn:
      conn.rollback()
    raise e

  finally:
    if conn:
      db_pool.putconn(conn)

def create_tables(path):
  with open(path, "r") as file:
    sql = file.read()
  try:
    execute(sql)
    print("Created tables successfully")
  except Exception as e:
    err_message = str(e)
    print(f"Failed to create tables: {err_message}")

if __name__ == "__main__":
  script_dir = Path(__file__).resolve().parent
  create_file = script_dir / "create.sql"
  create_tables(create_file)
