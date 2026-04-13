// Ejemplo 3: Tabla de multiplicar
// Usa un ciclo Para para mostrar la tabla de un numero

Proceso TablaMultiplicar
	Definir num, i Como Entero;

	Escribir "Ingrese un numero:";
	Leer num;

	Escribir "Tabla de multiplicar del ", num, ":";

	Para i <- 1 Hasta 10 Hacer
		Escribir num, " x ", i, " = ", num * i;
	FinPara
FinProceso
