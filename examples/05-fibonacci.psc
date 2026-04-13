// Ejemplo 5: Serie de Fibonacci
// Muestra los primeros N numeros de la serie

Proceso Fibonacci
	Definir n, i, a, b, temp Como Entero;

	Escribir "Cuantos numeros de Fibonacci desea?";
	Leer n;

	a <- 0;
	b <- 1;

	Escribir "Serie de Fibonacci:";

	Para i <- 1 Hasta n Hacer
		Escribir a;
		temp <- a + b;
		a <- b;
		b <- temp;
	FinPara
FinProceso
