"""Regresión: la página inicial debe renderizar con Starlette/Jinja2 modernos."""
from fastapi.testclient import TestClient
from app.main import app


def test_pagina_inicio_y_recursos():
    with TestClient(app) as cliente:
        pagina = cliente.get("/")
        assert pagina.status_code == 200, pagina.text
        assert "CRUZA" in pagina.text
        assert "/static/app.js" in pagina.text
        assert "/static/app.css" in pagina.text
        assert cliente.get("/static/app.js").status_code == 200
        assert cliente.get("/static/app.css").status_code == 200
        assert cliente.get("/favicon.ico").status_code == 200
        assert cliente.get("/static/favicon.svg").status_code == 200
