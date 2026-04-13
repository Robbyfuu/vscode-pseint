// Ejemplo 4: Promedio de notas
// Lee 5 notas, calcula el promedio y dice si aprobo o reprobo

Proceso NotasAlumno
	Definir nota, suma, promedio Como Real;
	Definir i Como Entero;

	suma <- 0;

	Para i <- 1 Hasta 5 Hacer
		Escribir "Ingrese la nota ", i, ":";
		Leer nota;
		suma <- suma + nota;
	FinPara

	promedio <- suma / 5;

	Escribir "Promedio: ", promedio;

	Segun Verdadero Hacer
		promedio >= 6:
			Escribir "Aprobado!";
		promedio >= 4:
			Escribir "Debe rendir examen";
		De Otro Modo:
			Escribir "Reprobado";
	FinSegun
FinProceso
