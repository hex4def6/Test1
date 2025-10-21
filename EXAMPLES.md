# x86 Assembly Interpreter - Graphics Examples

This document provides examples of using the graphics and input features.

## Graphics Interrupts

### INT 0x81 - Set Pixel
Sets a single pixel on the 128x128 display.

**Parameters:**
- EAX: X coordinate (0-127)
- EBX: Y coordinate (0-127)
- ECX: Color (0-15)

**Example:**
```assembly
; Draw a white pixel at (64, 64)
mov eax, 64
mov ebx, 64
mov ecx, 1      ; White
int 0x81
```

### INT 0x82 - Clear Screen
Fills the entire screen with a single color.

**Parameters:**
- ECX: Color (0-15)

**Example:**
```assembly
; Clear screen to black
mov ecx, 0
int 0x82
```

### INT 0x83 - Read Keyboard
Reads the state of a keyboard key.

**Parameters:**
- EAX: Key code (input)

**Returns:**
- EAX: Key state (1 = pressed, 0 = not pressed)

**Example:**
```assembly
; Check if left arrow is pressed
mov eax, 37     ; Left arrow key code
int 0x83
cmp eax, 1
je left_pressed
```

## Color Palette

The interpreter uses a 16-color palette:

| Color | Value | RGB |
|-------|-------|-----|
| Black | 0 | (0, 0, 0) |
| White | 1 | (255, 255, 255) |
| Red | 2 | (255, 0, 0) |
| Green | 3 | (0, 255, 0) |
| Blue | 4 | (0, 0, 255) |
| Yellow | 5 | (255, 255, 0) |
| Magenta | 6 | (255, 0, 255) |
| Cyan | 7 | (0, 255, 255) |
| Gray | 8 | (128, 128, 128) |
| Light Gray | 9 | (192, 192, 192) |
| Dark Red | 10 | (128, 0, 0) |
| Dark Green | 11 | (0, 128, 0) |
| Dark Blue | 12 | (0, 0, 128) |
| Olive | 13 | (128, 128, 0) |
| Purple | 14 | (128, 0, 128) |
| Teal | 15 | (0, 128, 128) |

## Common Key Codes

| Key | Code |
|-----|------|
| Space | 32 |
| Left Arrow | 37 |
| Up Arrow | 38 |
| Right Arrow | 39 |
| Down Arrow | 40 |
| 0-9 | 48-57 |
| A-Z | 65-90 |
| Enter | 13 |
| Escape | 27 |

## Example 1: Draw a Line

```assembly
; Draw a horizontal line
mov ebx, 64         ; Y = 64
mov ecx, 1          ; White color

mov eax, 0          ; Start X
line_loop:
    int 0x81        ; Draw pixel
    inc eax
    cmp eax, 128
    jl line_loop

hlt
```

## Example 2: Draw a Rectangle

```assembly
; Draw a filled rectangle
; Top-left: (20, 20), Size: 40x30, Color: Red

mov esi, 20         ; Start X
mov edi, 20         ; Start Y

draw_y:
    mov esi, 20     ; Reset X
    draw_x:
        mov eax, esi
        mov ebx, edi
        mov ecx, 2  ; Red
        int 0x81

        inc esi
        cmp esi, 60
        jl draw_x

    inc edi
    cmp edi, 50
    jl draw_y

hlt
```

## Example 3: Moving Square with Keyboard

```assembly
; Moving square controlled by arrow keys

; Initialize position
mov dword [0x1000], 64  ; X position
mov dword [0x1004], 64  ; Y position

game_loop:
    ; Clear screen
    mov ecx, 0
    int 0x82

    ; Check left arrow
    mov eax, 37
    int 0x83
    cmp eax, 1
    jne check_right
    mov eax, [0x1000]
    dec eax
    mov [0x1000], eax

    check_right:
    ; Check right arrow
    mov eax, 39
    int 0x83
    cmp eax, 1
    jne check_up
    mov eax, [0x1000]
    inc eax
    mov [0x1000], eax

    check_up:
    ; Check up arrow
    mov eax, 38
    int 0x83
    cmp eax, 1
    jne check_down
    mov eax, [0x1004]
    dec eax
    mov [0x1004], eax

    check_down:
    ; Check down arrow
    mov eax, 40
    int 0x83
    cmp eax, 1
    jne draw_square
    mov eax, [0x1004]
    inc eax
    mov [0x1004], eax

    draw_square:
    ; Draw 5x5 square
    mov esi, [0x1000]
    mov edi, [0x1004]

    mov ecx, 0
    square_y:
        mov edx, 0
        square_x:
            mov eax, esi
            add eax, edx
            mov ebx, edi
            add ebx, ecx
            mov ecx, 5  ; Yellow
            int 0x81
            mov ecx, ecx  ; Restore counter

            inc edx
            cmp edx, 5
            jl square_x

        inc ecx
        cmp ecx, 5
        jl square_y

    ; Delay
    mov ecx, 10000
    delay:
        dec ecx
        cmp ecx, 0
        jne delay

    jmp game_loop
```

## Example 4: Bouncing Ball

```assembly
; Bouncing ball animation

; Initialize ball
mov dword [0x1000], 64  ; X position
mov dword [0x1004], 64  ; Y position
mov dword [0x1008], 2   ; X velocity
mov dword [0x100C], 1   ; Y velocity

bounce_loop:
    ; Clear screen
    mov ecx, 0
    int 0x82

    ; Update X position
    mov eax, [0x1000]
    add eax, [0x1008]
    mov [0x1000], eax

    ; Check X bounds
    cmp eax, 0
    jle bounce_x
    cmp eax, 127
    jge bounce_x
    jmp update_y

    bounce_x:
        ; Reverse X velocity
        mov eax, [0x1008]
        not eax
        inc eax
        mov [0x1008], eax

    update_y:
    ; Update Y position
    mov eax, [0x1004]
    add eax, [0x100C]
    mov [0x1004], eax

    ; Check Y bounds
    cmp eax, 0
    jle bounce_y
    cmp eax, 127
    jge bounce_y
    jmp draw_ball

    bounce_y:
        ; Reverse Y velocity
        mov eax, [0x100C]
        not eax
        inc eax
        mov [0x100C], eax

    draw_ball:
    ; Draw ball (3x3 pixels)
    mov eax, [0x1000]
    mov ebx, [0x1004]

    ; Center pixel
    mov ecx, 1  ; White
    int 0x81

    ; Left pixel
    dec eax
    int 0x81

    ; Right pixel
    inc eax
    inc eax
    int 0x81

    ; Top pixel
    dec eax
    dec ebx
    int 0x81

    ; Bottom pixel
    inc ebx
    inc ebx
    int 0x81

    ; Delay
    mov ecx, 5000
    delay_loop:
        dec ecx
        cmp ecx, 0
        jne delay_loop

    jmp bounce_loop
```

## Example 5: Pattern Generator

```assembly
; Generate a colorful pattern

mov ebx, 0          ; Y coordinate
pattern_y:
    mov eax, 0      ; X coordinate
    pattern_x:
        ; Calculate color based on position
        mov ecx, eax
        add ecx, ebx
        and ecx, 15  ; Modulo 16 for color

        int 0x81     ; Draw pixel

        inc eax
        cmp eax, 128
        jl pattern_x

    inc ebx
    cmp ebx, 128
    jl pattern_y

hlt
```

## Tips for Graphics Programming

1. **Clear the screen at the start of each frame** to avoid artifacts
2. **Use delay loops** to control animation speed
3. **Store state in memory** (0x1000+) for game variables
4. **Batch pixel operations** when possible for performance
5. **Test boundary conditions** to prevent drawing outside the screen
6. **Use the Step button** to debug graphics code
7. **The Run button automatically detects game loops** and runs continuously

## Memory Layout Recommendations

For games, use this memory layout:

- **0x1000-0x10FF**: Game variables (positions, velocities, scores)
- **0x1100-0x1FFF**: Game state (object arrays, levels)
- **0x2000-0x2FFF**: Temporary calculation space
- **0xF000-0xF0FF**: Keyboard state (automatically populated)
- **0xF100-0xFFFF**: Stack space

## Debugging Graphics Programs

1. Use the **Step** button to execute one instruction at a time
2. Watch the **Registers** panel to see variable values
3. Use the **Memory View** to inspect game state
4. Check the **Status Bar** for execution information
5. Click **Stop** to pause a running game loop
