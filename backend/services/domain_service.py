from sqlalchemy.orm import Session
from sqlalchemy import text

class DomainService:
    def __init__(self, db: Session):
        self.db = db

    def get_domain_values(self, domain_name: str):
        """
        Obtiene los valores activos de un catálogo (dom_*)
        Ejemplo domain_name: 'tipo_gestion' -> dom_tipo_gestion
        """
        table_name = f"dom_{domain_name.lower().replace(' ', '_')}"
        # Costo 0: Validación simple para evitar SQL Injection
        allowed_domains = [
            'tipo_status', 'actividad_predial', 'gestor_predial', 
            'asistente_predial', 'analista_ambiental', 'tipo_aviso', 
            'municipio', 'departamento', 'zona_ejecutora', 'legalizacion', 'tipo_gestion'
        ]
        
        if domain_name.lower() not in allowed_domains:
            return []

        query = text(f"SELECT valor FROM {table_name} WHERE activo = TRUE ORDER BY valor ASC")
        result = self.db.execute(query).fetchall()
        return [row[0] for row in result]

    def validate(self, domain_name: str, value: str) -> bool:
        """Valida que un valor exista en el dominio."""
        table_name = f"dom_{domain_name.lower().replace(' ', '_')}"
        query = text(f"SELECT 1 FROM {table_name} WHERE valor = :val AND activo = TRUE LIMIT 1")
        res = self.db.execute(query, {"val": value}).fetchone()
        return res is not None

    def add_domain_value(self, domain_name: str, value: str):
        """Añade un nuevo valor al catálogo."""
        table_name = f"dom_{domain_name.lower()}"
        query = text(f"INSERT INTO {table_name} (valor) VALUES (:val) ON CONFLICT DO NOTHING")
        self.db.execute(query, {"val": value})
        self.db.commit()
        return True
