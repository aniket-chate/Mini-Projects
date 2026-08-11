#include<stdio.h>
int main ()
{
    char name [50];
    int phone_number;
    int customer_id;

    int body_soap;
    int hair_cream;
    int hair_spray;
    int body_sprey;

    int sugar;
    int tea;
    int coffee;
    int rice;
    int wheat;

    int pepsi;
    int sprite;
    int coke;
    int mojitos;
    int thumbs_up;

    int total;
    int cosmetics_total;
    int grocery_total;
    int beverage_total;
    
    printf("----------------------\n");
    printf("Biling system\n");
    printf("-----------------------\n");
    printf("customer Details\n");
    
    printf("Customer Name \n");
    scanf("%s",&name);
    printf("Customer Number:  \n");
    scanf("%d", &phone_number);
    printf("Customer ID : \n ");
    scanf("%d",&customer_id);
    
    printf("-------------------\n");

    printf("COSMETICS\n\n");
    printf(" Body soap (RS = 10) :  ");
    scanf("%d",&body_soap);
    printf("Hair Cream (RS = 25 ) :  ");
    scanf("%d",&hair_cream);
    printf(" Body Sprey (RS = 50)  :  ");
    scanf("%d",&body_sprey);

    printf("-------------------\n");

    printf(" GROCERIES \n\n");

    printf("Sugar (Rs = 100 ) :  ");
    scanf("%d", &sugar);
    printf("Tea (Rs = 15) ;  ");
    scanf("%d" , &tea);
    printf("Coffee ( Rs = 50) :  ");
    scanf("%d", &coffee);
    printf(" Rice ( Rs = 150) :  ");
    scanf("%d", &rice);
    printf(" Wheat ( Rs = 160) :  ");
    scanf("%d",&wheat);

    printf("-------------------\n");

    printf("BEVERAGES\n\n");

    printf("Pepsi (Rs = 30) :  ");
    scanf("%d", &pepsi);
    printf("Sprite (Rs = 35) : ");
    scanf("%d", &sprite);
    printf(" Coke (Rs = 30) : ");
    scanf("%d", &coke);
    printf("Mojistos (Rs = 25) :  ");
    scanf("d",&mojitos);
    printf("Thumbs_up (Rs = 35) : ");
    scanf("%d", &thumbs_up);

printf("------------------\n");

int boso;
int hc;
int hs;
int bosp;

boso = 10 * body_soap;
hc = 25 * hair_cream;
hs = 50 * hair_spray;
bosp = 50 * body_sprey;
cosmetics_total = boso + hc + hs + bosp;

printf("Body Soap : ");
printf("%d Rs\n ",boso);
printf("Hair Cream  : ");
printf("%d Rs\n", hc);
printf("Hair Sprey : ");
printf("%d Rs\n", hs);
printf("Total cosmetc price : ");
printf("%d", cosmetics_total);

printf("---------------\n");

int s,t,c,r,w;

s = 100 * sugar;
t = 15 * tea;
c = 50 * coffee;
r = 150 * rice;
w = 160 * wheat;
grocery_total = s + t + c + r + w;

printf("Sugar : ");
printf("%d RS\n ", s);
printf("Tea : ");
printf("%d Rs\n", t);
printf("Coffee : ");
printf("%d Rs\n ", c);
printf("Rice ; ");
printf("%d Rs\n", r);
printf("Wheat : ");
printf("%d Rs\n ",w);
printf("Total Grocery price ; ");
printf("%d Rs\n", grocery_total);

printf("----------------\n");
int pep;
int spr;
int cok;
int moj;
int thu;
pep = 30 * pepsi;
spr = 35 * sprite;
cok = 30 * coke;
moj = 25 * mojitos;
thu = 35 * thumbs_up;
beverage_total = pep + spr + cok + moj + thu;


printf("Pepsi : ");
printf(" %d Rs\n " , pep);
printf("Sprite : ");
printf("%d Rs \n " , spr);
printf("Coke : ");
printf("%d Rs \n " , cok);
printf("mojitos : ");
printf("%d Rs \n " , moj );
printf("Thumbs_up: ");
printf("%d Rs \n :" , thu );
printf("Total Beverage price : ");
printf(" %d Rs \n ",beverage_total);

printf("---------------------");

total = cosmetics_total + grocery_total + beverage_total;

printf(" Total Amount : ");
printf("%d Rs \n ", total);

printf("-----------------------");

printf("-----------------------------------------------");

printf("ANIKET SUPER MARKET \n\n");

printf(" Custmoer Name : ");
printf("%s\n",name);
printf("Custmor Phone Number : ");
printf("%d\n ",phone_number);
printf("Custmor ID : ");
printf("%d \n " ,customer_id);

printf("Product Name                     Quantity          Price\n\n");
printf("Body Soap                            %d               %d\n",body_soap,boso);
printf("Hair  Cream                          %d                %d\n",hair_cream,hc);
printf("Body Sprey                           %d                 %d\n",body_sprey,bosp);
printf("Hair Sprey                           %d                 %d\n",hair_spray,hs);
printf("Sugar                                %d                  %d\n",sugar,s);
printf("Tea                                  %d                   %d\n",tea,t);
printf("Coffee                               %d                   %d\n",coffee,c);
printf("Rice                                 %d                   %d\n",rice,r);
printf("Wheat                                %d                   %d\n",wheat,w);
printf("Pepsi                                %d                   %d\n",pepsi,pep);
printf("Sprite                               %d                    %d\n",sprite,spr);
printf("Coke                                 %d                   %d\n",coke,cok);
printf("Mojitos                              %d                   %d\n",mojitos,moj);
printf("Thumbs Up                            %d                    %d\n",thumbs_up,thu);

printf("Groccery Total  Price : %d\n\n",grocery_total);

printf("Cosmatic Total Price  : %d\n\n",cosmetics_total);

printf("Beverage Total price  : %d\n\n",beverage_total);

printf("Total Price           : %d\n\n",total);

printf("-----------------------------------------------------------------------------------------------------------------------------");

return 0;


}