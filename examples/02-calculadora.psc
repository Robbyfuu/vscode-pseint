// Ejemplo 2: Calculadora simple
// Lee dos numeros y muestra las operaciones basicas

Proceso Calculadora
	Definir a, b Como Real;

	Escribir "Ingrese el primer numero:";
	Leer a;
	Escribir "Ingrese el segundo numero:";
	Leer b;

	Escribir "Suma: ", a + b;
	Escribir "Resta: ", a - b;
	Escribir "Multiplicacion: ", a * b;

	Si b <> 0 Entonces
		Escribir "Division: ", a / b;
	SiNo
		Escribir "No se puede dividir por cero";
	FinSi
FinProceso
