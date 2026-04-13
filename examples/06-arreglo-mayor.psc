// Ejemplo 6: Encontrar el mayor en un arreglo
// Demuestra el uso de Dimension y arreglos

Proceso MayorEnArreglo
	Definir i, mayor Como Entero;
	Dimension numeros[5];

	// Leer 5 numeros
	Para i <- 1 Hasta 5 Hacer
		Escribir "Ingrese numero ", i, ":";
		Leer numeros[i];
	FinPara

	// Encontrar el mayor
	mayor <- numeros[1];
	Para i <- 2 Hasta 5 Hacer
		Si numeros[i] > mayor Entonces
			mayor <- numeros[i];
		FinSi
	FinPara

	Escribir "El mayor es: ", mayor;
FinProceso
