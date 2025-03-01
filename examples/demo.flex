// Example Flex program to demonstrate language features

// Variable declarations in Flex
rakm age = 25      // Integer variable
kasr pi = 3.14159  // Float variable
nass name = "Ahmed"  // String variable
so2al isActive = true  // Boolean variable
dorg numbers = [1, 2, 3, 4, 5]  // List variable

// Function definition
fun greet(nass person) {
    etb3("Hello, " + person + "!")
    rg3 true
}

// Alternative function syntax
sndo2 calculateArea(kasr radius) {
    rg3 pi * radius * radius
}

// Function call
greet(name)

// If statement
if (age >= 18) {
    etb3("You are an adult.")
} else {
    etb3("You are a minor.")
}

// Alternative if syntax
cond (isActive) {
    etb3("Status: Active")
} elif (age > 60) {
    etb3("Status: Retired")
} else {
    etb3("Status: Inactive")
}

// For loop
for (rakm i = 0; i < 5; i++) {
    etb3(i)
}

// Alternative loop syntax
loop (rakm i = 0; i < numbers.length; i++) {
    etb3("Number at index " + i + ": " + numbers[i])
}

// While loop
rakm counter = 0
while (counter < 3) {
    etb3("Counter: " + counter)
    counter = counter + 1
}

// Alternative while syntax
karr (isActive) {
    etb3("Still active!")
    isActive = false
}

// Input/output
etb3("Enter your name:")
nass userName = da5l()
etb3("Welcome, " + userName + "!")

// Calculation and output
kasr radius = 5.0
kasr area = calculateArea(radius)
etb3("The area of a circle with radius " + radius + " is " + area)
