print()
print("Welcome to you Calculator") 
print()

def calc():
    print("\n====== Calculator ======")
    print("1. Addition")
    print("2. Subtraction")
    print("3. Multiplication")
    print("4. Division")
    print("5. Back to Main menu")
    choose = int(input("Enter your Choice : "))
    if choose == 1:
        num1 = int(input("Enter your first number: "))
        num2 = int(input("Enter your second number: "))
        sum = num1 + num2
        print("The sum is : ", sum)
        
    elif choose == 2:
        num1 = int(input("Enter your first number: "))
        num2 = int(input("Enter your second number: "))
        sub = num1 - num2
        print("The Substraction is : ", sub)
        
    elif choose == 3 :
        num1 = int(input("Enter your first number: "))
        num2 = int(input("Enter your second number: "))
        mul = num1 * num2
        print("The Multiplication is : ", mul)
        
    elif choose == 4 :
        num1 = int(input("Enter your first number: "))
        num2 = int(input("Enter your second number: "))
        
        if num2 == 0 :
            
          print("Error! Division by zero is not allowed.")
          return
        div = num1 / num2
        print("The Division is : ", div)
      
    elif choose == 5 :
        return
        
    else :
        print("Invalid choice")
        
def area ():
    print("\n====== Area Section ======")
    print("1. Area of Circle")
    print("2. Area of Rectangle")
    print("3. Area of Triangle")
    print("4. Area of Square")
    print("5. Back to main menu")
    choose = int(input("Enter your Choice : "))
    
    if choose == 1 :
        pi = 3.14
        r = int(input("Enter the radius of the circle : "))
        area_circle = pi * r * r
        print("The area of the circle is : ", area_circle)
        
    elif choose == 2 :
        w = int(input("Enter the width of the rectangle : "))
        l = int(input("Enter the length of the rectangle : "))
        area_rectangle = w * l
        print("The area of the rectangle is : ", area_rectangle)
        
    elif choose == 3 :
        a = 0.5
        b = int(input("Enter the base of the triangle : "))
        h = int(input("Enter the height of the triangle : "))
        area_triangle = a * b * h
        print("The area of the triangle is : ", area_triangle)
        
    elif choose == 4 :
         a = int(input("Enter the side of the square : "))
         area_square = a * a
         print("The area of the square is : ", area_square)
         
    elif choose == 5 :
        return
                  
    else :
        print("Invalid choice")
        
def main ():
    while True :
        print("\n====== Main Menu ======")
        print("1. Calculator")
        print("2. Area of Shapes")
        print("3. Exit")
        choose = int(input("Enter your choice : "))
        
        if choose == 1 :
            calc()
        elif choose == 2 :
            area()
        elif choose == 3 :
            print("Thank you for using the calculator")
            break
            
        else :
            print("Invalid Choice!")  
            
main()                      
            
        
    
        
      

     