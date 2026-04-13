// Ejemplo 7: Adivina el numero
// Juego usando Repetir y Aleatorio

Proceso AdivinaNumero
	Definir secreto, intento, intentos Como Entero;

	secreto <- Aleatorio(1, 100);
	intentos <- 0;

	Escribir "Adivina el numero entre 1 y 100!";

	Repetir
		Escribir "Tu intento:";
		Leer intento;
		intentos <- intentos + 1;

		Si intento < secreto Entonces
			Escribir "Muy bajo! Intenta de nuevo.";
		SiNo
			Si intento > secreto Entonces
				Escribir "Muy alto! Intenta de nuevo.";
			FinSi
		FinSi
	Hasta Que intento = secreto

	Escribir "Felicidades! Adivinaste en ", intentos, " intentos!";
FinProceso
